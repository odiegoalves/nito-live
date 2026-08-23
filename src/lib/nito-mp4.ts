// =============================================================================
// NITO LIVE - separador de audio e video de arquivos MP4 / MOV.
//
// A ideia em uma frase: os dados comprimidos NUNCA sao tocados.
//
// O programa le a "planta" do arquivo (o box moov, que diz onde cada pedaco de
// imagem e de som comeca e quanto ocupa), monta uma planta nova contendo so uma
// das trilhas, e copia os pedacos daquela trilha byte a byte.
//
// Por isso nao existe perda, congelamento, pico de audio nem tela preta: nada
// foi recalculado. Tambem por isso o tamanho do arquivo nao importa - em
// momento nenhum o arquivo inteiro precisa caber na memoria.
//
// Esta implementacao foi conferida contra o ffmpeg em quatro formatos (MP4
// comum, MP4 com moov no inicio, MP4 com quadros B e MOV): o md5 do fluxo
// comprimido e dos tempos de apresentacao saiu igual ao do original nos quatro.
// =============================================================================

// ─── leitura crua ────────────────────────────────────────────────────────────

function u32(b: Uint8Array, i: number) {
  return ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
}
function u16(b: Uint8Array, i: number) { return (b[i] << 8) + b[i + 1]; }
function u64(b: Uint8Array, i: number) { return u32(b, i) * 4294967296 + u32(b, i + 4); }
function tipoDe(b: Uint8Array, i: number) {
  return String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
}

interface Caixa { tipo: string; inicio: number; fim: number; corpo: number }

/** Percorre os boxes de um nivel, sem entrar neles. */
function listarBoxes(b: Uint8Array, de: number, ate: number): Caixa[] {
  const saida: Caixa[] = [];
  let i = de;
  while (i + 8 <= ate) {
    let tam = u32(b, i);
    const t = tipoDe(b, i + 4);
    let corpo = i + 8;
    if (tam === 1) { tam = u64(b, i + 8); corpo = i + 16; }
    else if (tam === 0) { tam = ate - i; }
    if (tam < 8 || i + tam > ate) break;
    saida.push({ tipo: t, inicio: i, fim: i + tam, corpo });
    i += tam;
  }
  return saida;
}

function achar(lista: Caixa[], t: string): Caixa | null {
  for (const c of lista) if (c.tipo === t) return c;
  return null;
}

// ─── tabelas do stbl ─────────────────────────────────────────────────────────

export interface Amostra { offset: number; tamanho: number; duracao: number; desloc: number; chave: boolean }

function montarAmostras(b: Uint8Array, stbl: Caixa[]): Amostra[] {
  const cxStts = achar(stbl, 'stts');
  const cxStsz = achar(stbl, 'stsz');
  const cxStsc = achar(stbl, 'stsc');
  const cxStco = achar(stbl, 'stco') || achar(stbl, 'co64');
  if (!cxStts || !cxStsz || !cxStsc || !cxStco) throw new Error('trilha sem tabela completa');

  // stts: quantas amostras com cada duracao
  const duracoes: [number, number][] = [];
  {
    const n = u32(b, cxStts.corpo + 4); let p = cxStts.corpo + 8;
    for (let i = 0; i < n; i++) { duracoes.push([u32(b, p), u32(b, p + 4)]); p += 8; }
  }
  // stsz: tamanho de cada amostra
  let tamanhos: Uint32Array;
  {
    const padrao = u32(b, cxStsz.corpo + 4);
    const n = u32(b, cxStsz.corpo + 8);
    tamanhos = new Uint32Array(n);
    if (padrao !== 0) { tamanhos.fill(padrao); }
    else { let p = cxStsz.corpo + 12; for (let i = 0; i < n; i++) { tamanhos[i] = u32(b, p); p += 4; } }
  }
  // stsc: quantas amostras por pedaco
  const regras: { primeiroPedaco: number; porPedaco: number }[] = [];
  {
    const n = u32(b, cxStsc.corpo + 4); let p = cxStsc.corpo + 8;
    for (let i = 0; i < n; i++) {
      regras.push({ primeiroPedaco: u32(b, p), porPedaco: u32(b, p + 4) });
      p += 12;
    }
  }
  // stco / co64: onde cada pedaco comeca
  const ehLongo = cxStco.tipo === 'co64';
  const offsets: number[] = [];
  {
    const n = u32(b, cxStco.corpo + 4); let p = cxStco.corpo + 8;
    for (let i = 0; i < n; i++) { offsets.push(ehLongo ? u64(b, p) : u32(b, p)); p += ehLongo ? 8 : 4; }
  }
  // ctts: deslocamento de apresentacao (existe quando ha quadros B)
  const cxCtts = achar(stbl, 'ctts');
  let deslocs: [number, number][] | null = null;
  if (cxCtts) {
    deslocs = [];
    const versao = b[cxCtts.corpo];
    const n = u32(b, cxCtts.corpo + 4); let p = cxCtts.corpo + 8;
    for (let i = 0; i < n; i++) {
      const qtd = u32(b, p);
      const d = versao === 0 ? u32(b, p + 4) : (u32(b, p + 4) | 0);
      deslocs.push([qtd, d]); p += 8;
    }
  }
  // stss: quais amostras sao ponto de corte
  const cxStss = achar(stbl, 'stss');
  let chaves: Set<number> | null = null;
  if (cxStss) {
    chaves = new Set();
    const n = u32(b, cxStss.corpo + 4); let p = cxStss.corpo + 8;
    for (let i = 0; i < n; i++) { chaves.add(u32(b, p)); p += 4; }
  }

  const total = tamanhos.length;
  const amostras: Amostra[] = new Array(total);

  const porPedaco: number[] = new Array(offsets.length);
  for (let p = 0; p < offsets.length; p++) {
    let regra = regras[0];
    for (const r of regras) if (r.primeiroPedaco <= p + 1) regra = r;
    porPedaco[p] = regra.porPedaco;
  }

  let n = 0;
  for (let pi = 0; pi < offsets.length && n < total; pi++) {
    let pos = offsets[pi];
    for (let k = 0; k < porPedaco[pi] && n < total; k++) {
      amostras[n] = { offset: pos, tamanho: tamanhos[n], duracao: 0, desloc: 0, chave: true };
      pos += tamanhos[n];
      n++;
    }
  }
  if (n !== total) throw new Error('a tabela de pedacos nao fecha com o numero de amostras');

  let idx = 0;
  for (const [qtd, dur] of duracoes) for (let q = 0; q < qtd && idx < total; q++) amostras[idx++].duracao = dur;

  if (deslocs) {
    let j = 0;
    for (const [qtd, d] of deslocs) for (let w = 0; w < qtd && j < total; w++) amostras[j++].desloc = d;
  }
  if (chaves) for (let c = 0; c < total; c++) amostras[c].chave = chaves.has(c + 1);

  return amostras;
}

// ─── escrita ─────────────────────────────────────────────────────────────────

function esc(texto: string) {
  const b = new Uint8Array(4);
  for (let i = 0; i < 4; i++) b[i] = texto.charCodeAt(i);
  return b;
}
function de32(v: number) {
  return new Uint8Array([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
}
function de16(v: number) { return new Uint8Array([(v >>> 8) & 255, v & 255]); }
function de64(v: number) {
  const alto = Math.floor(v / 4294967296);
  return juntar([de32(alto), de32(v >>> 0)]);
}
function juntar(partes: Uint8Array[]) {
  let total = 0;
  for (const p of partes) total += p.length;
  const saida = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) { saida.set(p, pos); pos += p.length; }
  return saida;
}
function box(nome: string, partes: Uint8Array[]) {
  const conteudo = juntar(partes);
  return juntar([de32(conteudo.length + 8), esc(nome), conteudo]);
}
function boxCheio(nome: string, versao: number, flags: number, partes: Uint8Array[]) {
  const cab = new Uint8Array([versao, (flags >>> 16) & 255, (flags >>> 8) & 255, flags & 255]);
  return box(nome, [cab, ...partes]);
}

const MATRIZ = juntar([
  de32(0x00010000), de32(0), de32(0),
  de32(0), de32(0x00010000), de32(0),
  de32(0), de32(0), de32(0x40000000),
]);

function fazerStts(amostras: Amostra[]) {
  const linhas: [number, number][] = [];
  let atual: [number, number] | null = null;
  for (const a of amostras) {
    if (atual && atual[1] === a.duracao) atual[0]++;
    else { atual = [1, a.duracao]; linhas.push(atual); }
  }
  const partes = [de32(linhas.length)];
  for (const [q, d] of linhas) { partes.push(de32(q), de32(d)); }
  return boxCheio('stts', 0, 0, partes);
}

function fazerCtts(amostras: Amostra[]) {
  if (!amostras.some((a) => a.desloc !== 0)) return null;
  const linhas: [number, number][] = [];
  let atual: [number, number] | null = null;
  for (const a of amostras) {
    if (atual && atual[1] === a.desloc) atual[0]++;
    else { atual = [1, a.desloc]; linhas.push(atual); }
  }
  const partes = [de32(linhas.length)];
  for (const [q, d] of linhas) { partes.push(de32(q), de32(d | 0)); }
  // Versao 1 aceita deslocamento negativo, que h264 com quadros B usa.
  return boxCheio('ctts', 1, 0, partes);
}

function fazerStss(amostras: Amostra[]) {
  const lista: number[] = [];
  amostras.forEach((a, i) => { if (a.chave) lista.push(i + 1); });
  if (lista.length === amostras.length) return null;
  const partes = [de32(lista.length)];
  for (const n of lista) partes.push(de32(n));
  return boxCheio('stss', 0, 0, partes);
}

function fazerStsz(amostras: Amostra[]) {
  const partes = [de32(0), de32(amostras.length)];
  for (const a of amostras) partes.push(de32(a.tamanho));
  return boxCheio('stsz', 0, 0, partes);
}

/** Uma amostra por pedaco: simples e sempre correto. */
function fazerStsc() {
  return boxCheio('stsc', 0, 0, [de32(1), de32(1), de32(1), de32(1)]);
}

function fazerOffsets(amostras: Amostra[], inicioDados: number, longo: boolean) {
  const partes = [de32(amostras.length)];
  let pos = inicioDados;
  for (const a of amostras) {
    partes.push(longo ? de64(pos) : de32(pos));
    pos += a.tamanho;
  }
  return boxCheio(longo ? 'co64' : 'stco', 0, 0, partes);
}

// ─── leitura do arquivo ──────────────────────────────────────────────────────

export interface Trilha {
  tipo: 'video' | 'audio' | string;
  codec: string;
  escalaFilme: number;
  escala: number;
  duracao: number;
  idioma: number;
  largura: number;
  altura: number;
  amostras: Amostra[];
  bytes: number;
  segundos: number;
  stsdCru: Uint8Array;
  edtsCru: Uint8Array | null;
}

export interface Planta { ftyp: Uint8Array | null; trilhas: Trilha[] }

type Leitor = (de: number, ate: number) => Promise<Uint8Array>;

/** Le ftyp e moov sem carregar o resto do arquivo. */
export async function lerPlanta(ler: Leitor, tamanhoArquivo: number): Promise<Planta> {
  let pos = 0;
  let ftyp: Uint8Array | null = null;
  let moov: Uint8Array | null = null;

  // Percorre so os cabecalhos dos boxes de topo. Funciona tanto com a planta no
  // comeco quanto no fim, que e como gravadores de live costumam salvar.
  while (pos + 8 <= tamanhoArquivo) {
    const cab = await ler(pos, Math.min(pos + 16, tamanhoArquivo));
    let tam = u32(cab, 0);
    const t = tipoDe(cab, 4);
    if (tam === 1) tam = u64(cab, 8);
    else if (tam === 0) tam = tamanhoArquivo - pos;
    if (tam < 8) throw new Error('Este arquivo nao parece um MP4 valido.');
    if (t === 'ftyp') ftyp = await ler(pos, pos + tam);
    if (t === 'moov') moov = await ler(pos, pos + tam);
    if (ftyp && moov) break;
    pos += tam;
  }
  if (!moov) throw new Error('Nao encontrei a planta do arquivo. Ele pode ser MKV, AVI ou estar incompleto.');

  return { ftyp, trilhas: lerTrilhas(moov) };
}

function lerTrilhas(moov: Uint8Array): Trilha[] {
  const topo = listarBoxes(moov, 8, moov.length);
  const mvhd = achar(topo, 'mvhd');
  if (!mvhd) throw new Error('planta sem mvhd');
  const vMvhd = moov[mvhd.corpo];
  const escalaFilme = vMvhd === 1 ? u32(moov, mvhd.corpo + 20) : u32(moov, mvhd.corpo + 12);

  const trilhas: Trilha[] = [];
  for (const trak of topo) {
    if (trak.tipo !== 'trak') continue;
    const dentro = listarBoxes(moov, trak.corpo, trak.fim);
    const tkhd = achar(dentro, 'tkhd');
    const edts = achar(dentro, 'edts');
    const mdia = achar(dentro, 'mdia');
    if (!tkhd || !mdia) continue;

    const largura = u32(moov, tkhd.fim - 8) / 65536;
    const altura = u32(moov, tkhd.fim - 4) / 65536;

    const dm = listarBoxes(moov, mdia.corpo, mdia.fim);
    const mdhd = achar(dm, 'mdhd');
    const hdlr = achar(dm, 'hdlr');
    const minf = achar(dm, 'minf');
    if (!mdhd || !hdlr || !minf) continue;

    const vMdhd = moov[mdhd.corpo];
    const escala = vMdhd === 1 ? u32(moov, mdhd.corpo + 20) : u32(moov, mdhd.corpo + 12);
    const duracao = vMdhd === 1 ? u64(moov, mdhd.corpo + 24) : u32(moov, mdhd.corpo + 16);
    const idioma = vMdhd === 1 ? u16(moov, mdhd.corpo + 32) : u16(moov, mdhd.corpo + 20);

    const manipulador = tipoDe(moov, hdlr.corpo + 8);
    const dmi = listarBoxes(moov, minf.corpo, minf.fim);
    const stbl = achar(dmi, 'stbl');
    if (!stbl) continue;
    const dstbl = listarBoxes(moov, stbl.corpo, stbl.fim);
    const stsd = achar(dstbl, 'stsd');
    if (!stsd) continue;

    let amostras: Amostra[];
    try { amostras = montarAmostras(moov, dstbl); }
    catch { continue; }

    let bytes = 0;
    for (const a of amostras) bytes += a.tamanho;

    trilhas.push({
      tipo: manipulador === 'vide' ? 'video' : manipulador === 'soun' ? 'audio' : manipulador,
      codec: tipoDe(moov, stsd.corpo + 12),
      escalaFilme, escala, duracao, idioma, largura, altura,
      amostras, bytes,
      segundos: escala ? duracao / escala : 0,
      stsdCru: moov.slice(stsd.inicio, stsd.fim),
      edtsCru: edts ? moov.slice(edts.inicio, edts.fim) : null,
    });
  }
  return trilhas;
}

// ─── montagem da saida ───────────────────────────────────────────────────────

export interface Plano { cabecalho: Uint8Array; copias: Amostra[]; bytesDados: number; bytesTotal: number }

export function montarSaida(trilha: Trilha, ftypCru: Uint8Array | null): Plano {
  const ehVideo = trilha.tipo === 'video';
  const bytesDados = trilha.bytes;

  const ftyp = ftypCru ?? box('ftyp', [esc('isom'), de32(512), esc('isom'), esc('iso2'), esc('avc1'), esc('mp41')]);
  const duracaoFilme = Math.round(trilha.duracao * (trilha.escalaFilme / trilha.escala));

  function moovCom(inicioDados: number, longo: boolean) {
    const mvhd = boxCheio('mvhd', 0, 0, [
      de32(0), de32(0), de32(trilha.escalaFilme), de32(duracaoFilme),
      de32(0x00010000), de16(0x0100), de16(0),
      de32(0), de32(0), MATRIZ,
      de32(0), de32(0), de32(0), de32(0), de32(0), de32(0),
      de32(2),
    ]);

    const tkhd = boxCheio('tkhd', 0, 3, [
      de32(0), de32(0), de32(1), de32(0), de32(duracaoFilme),
      de32(0), de32(0), de16(0), de16(0),
      de16(ehVideo ? 0 : 0x0100), de16(0), MATRIZ,
      de32(Math.round((ehVideo ? trilha.largura : 0) * 65536)),
      de32(Math.round((ehVideo ? trilha.altura : 0) * 65536)),
    ]);

    const mdhd = boxCheio('mdhd', 0, 0, [
      de32(0), de32(0), de32(trilha.escala), de32(trilha.duracao),
      de16(trilha.idioma), de16(0),
    ]);

    const hdlr = boxCheio('hdlr', 0, 0, [
      de32(0), esc(ehVideo ? 'vide' : 'soun'),
      de32(0), de32(0), de32(0), new Uint8Array([0]),
    ]);

    const cabMidia = ehVideo
      ? boxCheio('vmhd', 0, 1, [de16(0), de16(0), de16(0), de16(0)])
      : boxCheio('smhd', 0, 0, [de16(0), de16(0)]);

    const dinf = box('dinf', [boxCheio('dref', 0, 0, [de32(1), boxCheio('url ', 0, 1, [])])]);

    // O stsd vai copiado byte a byte: e ele que carrega a descricao do codec
    // (avcC, esds). Recalcular isso seria justamente onde nasceriam os defeitos.
    const tabelas: Uint8Array[] = [trilha.stsdCru, fazerStts(trilha.amostras)];
    const ctts = fazerCtts(trilha.amostras);
    if (ctts) tabelas.push(ctts);
    if (ehVideo) { const stss = fazerStss(trilha.amostras); if (stss) tabelas.push(stss); }
    tabelas.push(fazerStsc(), fazerStsz(trilha.amostras), fazerOffsets(trilha.amostras, inicioDados, longo));

    const mdia = box('mdia', [mdhd, hdlr, box('minf', [cabMidia, dinf, box('stbl', tabelas)])]);
    const pecas = trilha.edtsCru ? [tkhd, trilha.edtsCru, mdia] : [tkhd, mdia];
    return box('moov', [mvhd, box('trak', pecas)]);
  }

  // O tamanho do moov depende dos offsets, e os offsets dependem do tamanho do
  // moov. Monta uma vez para medir e outra com o valor certo; como a tabela tem
  // tamanho fixo, a segunda montagem sai do mesmo tamanho.
  let tentativa = moovCom(0, false);
  const longo = ftyp.length + tentativa.length + 16 + bytesDados > 4294967295;
  if (longo) tentativa = moovCom(0, true);

  const cabMdat = longo
    ? juntar([de32(1), esc('mdat'), de64(bytesDados + 16)])
    : juntar([de32(bytesDados + 8), esc('mdat')]);

  const inicioDados = ftyp.length + tentativa.length + cabMdat.length;
  const moov = moovCom(inicioDados, longo);
  if (moov.length !== tentativa.length) throw new Error('planta instavel — nada foi gravado');

  const cabecalho = juntar([ftyp, moov, cabMdat]);
  return { cabecalho, copias: trilha.amostras, bytesDados, bytesTotal: cabecalho.length + bytesDados };
}

/**
 * Junta amostras vizinhas num bloco unico de leitura.
 *
 * Sem isto, um video de 3 horas viraria centenas de milhares de leituras de
 * poucos quilobytes cada. Como as amostras costumam estar lado a lado no
 * arquivo original, quase todas se fundem em blocos grandes - o mesmo dado, uma
 * fracao das idas ao disco.
 */
export function agruparCopias(amostras: Amostra[], maxBloco = 8 * 1024 * 1024) {
  const blocos: { de: number; ate: number }[] = [];
  let de = -1, ate = -1;
  for (const a of amostras) {
    if (de < 0) { de = a.offset; ate = a.offset + a.tamanho; continue; }
    if (a.offset === ate && ate - de + a.tamanho <= maxBloco) { ate += a.tamanho; continue; }
    blocos.push({ de, ate });
    de = a.offset; ate = a.offset + a.tamanho;
  }
  if (de >= 0) blocos.push({ de, ate });
  return blocos;
}
