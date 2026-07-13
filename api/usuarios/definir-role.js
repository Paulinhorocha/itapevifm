const { validarAdmin, getAdminClient } = require('./_helpers');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const auth = await validarAdmin(req, res);
  if (!auth) return;

  const { id, role } = req.body || {};
  if (!id || !['admin', 'editor'].includes(role)) {
    res.status(400).json({ error: 'Dados inválidos.' });
    return;
  }

  const admin = getAdminClient();
  const { error } = await admin.from('profiles').update({ role }).eq('id', id);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
};
