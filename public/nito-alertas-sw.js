/* NITO Alertas - trabalhador de servico.
 *
 * De proposito ele NAO guarda nada em cache. Motivo: um app de alerta de venda
 * so tem valor com dado do minuto; servir tela velha aqui seria pior que nao
 * abrir.
 *
 * A funcao dele e outra: receber o aviso de venda mesmo com o aplicativo
 * fechado e a tela bloqueada. Isso e o unico caminho possivel no iPhone, e so
 * funciona para app adicionado a Tela de Inicio.
 */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

// Repassa para a rede, sem intermediar.
self.addEventListener('fetch', function () {});

// Chegou aviso de venda vindo do servidor.
self.addEventListener('push', function (e) {
  var d = { titulo: 'NITO LIVE', corpo: 'Nova venda na sua live', url: '/alertas' };
  try {
    if (e.data) {
      var j = e.data.json();
      if (j && typeof j === 'object') {
        d.titulo = j.titulo || d.titulo;
        d.corpo = j.corpo || d.corpo;
        d.url = j.url || d.url;
      }
    }
  } catch (x) {
    // Payload que nao e JSON ainda serve como texto do aviso.
    try { if (e.data) d.corpo = e.data.text(); } catch (y) {}
  }

  e.waitUntil(
    self.registration.showNotification(d.titulo, {
      body: d.corpo,
      icon: '/alertas/icone-192.png',
      badge: '/alertas/icone-192.png',
      data: { url: d.url },
      vibrate: [120, 60, 120],
      tag: 'nito-venda',
      renotify: true
    })
  );
});

// Toque no aviso: traz o app para a frente em vez de abrir outra aba.
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var destino = (e.notification.data && e.notification.data.url) || '/alertas';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].url.indexOf('/alertas') !== -1 && 'focus' in lista[i]) return lista[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
