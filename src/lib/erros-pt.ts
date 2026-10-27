import { toast } from "sonner";

const MAPA: [RegExp, string][] = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "E-mail ainda não confirmado."],
  [/user already registered|already been registered/i, "Este e-mail já está cadastrado. Faça login."],
  [/password should be at least (\d+)/i, "A senha precisa ter pelo menos $1 caracteres."],
  [/weak password|password is too weak|pwned|known to be weak/i, "Senha muito fraca. Escolha outra mais segura."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/unable to validate email address|invalid email|invalid format/i, "E-mail inválido."],
  [/rate limit|too many requests|security purposes/i, "Muitas tentativas. Aguarde um pouco e tente novamente."],
  [/user not found/i, "Usuário não encontrado."],
  [/jwt expired|session.*(expired|missing)|auth session missing/i, "Sua sessão expirou. Entre novamente."],
  [/token has expired|invalid.*(otp|token)|link is invalid/i, "Link inválido ou expirado."],
  [/failed to fetch|network ?error|load failed/i, "Falha de conexão. Verifique sua internet."],
  [/row-level security|permission denied|not authorized|forbidden/i, "Você não tem permissão para esta ação."],
  [/duplicate key|already exists/i, "Esse registro já existe."],
  [/violates foreign key/i, "Não foi possível concluir: existe um registro vinculado."],
  [/violates not-null|null value in column/i, "Preencha todos os campos obrigatórios."],
  [/payload too large|exceeded the maximum allowed size|entity too large/i, "Arquivo grande demais."],
  [/mime type|invalid file type/i, "Tipo de arquivo não permitido."],
  [/signups not allowed/i, "Cadastros estão desativados no momento."],
];

export function traduzirErro(msg: string): string {
  for (const [re, pt] of MAPA) {
    const m = msg.match(re);
    if (m) return pt.replace("$1", m[1] ?? "");
  }
  return msg;
}

let instalado = false;
export function instalarTraducaoToast() {
  if (instalado) return;
  instalado = true;
  const original = toast.error;
  (toast as { error: typeof toast.error }).error = ((msg, opts) =>
    original(typeof msg === "string" ? traduzirErro(msg) : msg, opts)) as typeof toast.error;
}

instalarTraducaoToast();
