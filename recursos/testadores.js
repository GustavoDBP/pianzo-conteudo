// Inscrição de testadores: grava testadores/{e-mail em minúsculas} no Firestore do projeto pianzo, pela API REST
// (sem SDK). Só criar é permitido, e as regras (firestore.rules) conferem cada campo; ninguém lê pelo site.
// A chave é a mesma do app (google-services.json): chave do Firebase não é segredo, quem protege são as regras.
// A lista sai com tools/firebase/testadores.js.
(function () {
  const PROJETO = 'pianzo';
  const CHAVE = 'AIzaSyCneNMD3A80v1qsYiQR7ig7Un7fS4_hTEE';
  const URL = 'https://firestore.googleapis.com/v1/projects/' + PROJETO
    + '/databases/(default)/documents/testadores';
  const EMAIL = /^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/;

  const form = document.getElementById('form-testador');
  const status = document.getElementById('form-status');
  const pronto = document.getElementById('form-pronto');
  const botao = form.querySelector('button[type=submit]');

  function erro(texto, campo) {
    status.textContent = texto;
    status.className = 'status erro';
    if (campo) {
      campo.setAttribute('aria-invalid', 'true');
      campo.focus();
    }
  }

  form.addEventListener('input', function (e) { e.target.removeAttribute('aria-invalid'); });

  function concluir(nome, email) {
    document.getElementById('pronto-nome').textContent = nome.split(/\s+/)[0];
    document.getElementById('pronto-email').textContent = email;
    form.hidden = true;
    pronto.hidden = false;
    pronto.focus({ preventScroll: true });
    pronto.scrollIntoView({ block: 'center' });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const v = function (id) { return form.elements[id].value.trim(); };
    const nome = v('nome');
    const email = v('email').toLowerCase();
    if (v('site')) return concluir(nome || 'você', email); // robô: finge que deu certo
    if (!nome) return erro('Conte como você se chama.', form.elements.nome);
    if (!EMAIL.test(email) || email.length > 120) return erro('Confira o e-mail.', form.elements.email);
    if (!v('teclado')) return erro('Diga se você tem teclado.', form.elements.teclado);
    if (!v('nivel')) return erro('Diga quanto você já toca.', form.elements.nivel);
    if (!form.elements.aceite.checked) return erro('Para continuar, marque o aceite.', form.elements.aceite);

    const campos = {
      nome: nome.slice(0, 80),
      email: email,
      aparelho: v('aparelho').slice(0, 80),
      teclado: v('teclado'),
      nivel: v('nivel'),
      mensagem: v('mensagem').slice(0, 600),
      idioma: (navigator.language || '').slice(0, 10),
      aceite: true,
    };
    const fields = {};
    for (const k in campos) {
      fields[k] = typeof campos[k] === 'boolean' ? { booleanValue: campos[k] } : { stringValue: campos[k] };
    }

    botao.disabled = true;
    status.textContent = 'Enviando…';
    status.className = 'status';
    try {
      const r = await fetch(URL + '?documentId=' + encodeURIComponent(email) + '&key=' + CHAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fields }),
      });
      // 409: esse e-mail já se inscreveu, então está tudo certo
      if (r.ok || r.status === 409) return concluir(nome, email);
      erro('Não deu para enviar agora (erro ' + r.status + '). Tente de novo daqui a pouco.');
    } catch (_) {
      erro('Sem conexão. Confira a internet e tente de novo.');
    } finally {
      botao.disabled = false;
    }
  });
})();
