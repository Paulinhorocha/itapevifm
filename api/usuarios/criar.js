const { validarAdmin, getAdminClient } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const auth = await validarAdmin(req, res);
  if (!auth) return; // validarAdmin já respondeu com o erro

  const { email, password, role } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email inválido.' });
    return;
  }
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
    return;
  }
  const papelFinal = (role === 'admin') ? 'admin' : 'editor';

  const admin = getAdminClient();

  // Cria a conta já ativa e com o email confirmado — a pessoa loga direto
  // com o email/senha que você definiu, sem precisar clicar em link nenhum.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  // O trigger no banco já cria o profile com papel "editor" por padrão.
  // Se foi criado como admin, atualiza o papel imediatamente.
  if (papelFinal === 'admin' && data?.user?.id) {
    const { error: roleError } = await admin.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
    if (roleError) {
      res.status(200).json({ ok: true, aviso: 'Usuário criado, mas não foi possível definir como admin automaticamente. Use "Tornar admin" na lista depois.' });
      return;
    }
  }

  res.status(200).json({ ok: true });
};
