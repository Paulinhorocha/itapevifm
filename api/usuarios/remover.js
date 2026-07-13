const { validarAdmin, getAdminClient } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const auth = await validarAdmin(req, res);
  if (!auth) return;

  const { id } = req.body || {};
  if (!id) {
    res.status(400).json({ error: 'ID ausente.' });
    return;
  }
  if (id === auth.userId) {
    res.status(400).json({ error: 'Você não pode remover a própria conta por aqui.' });
    return;
  }

  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
};
