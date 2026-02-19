# Jacare Veiculos

Aplicacao web de venda de carros e motos com:

- login de **cliente** e **administrador**
- painel admin para cadastro de veiculos
- upload de imagem com conversao automatica para **WEBP** (otimizacao de performance)
- controle de destaque semanal e status de documentacao por veiculo

## Rodando localmente

```bash
npm install
npm run db:setup
npm run dev
```

Aplicacao em: `http://localhost:3000`

## Credenciais iniciais

- Admin: `admin@jacareveiculos.com` / `Admin@123`
- Cliente: `cliente@jacareveiculos.com` / `Cliente@123`

## Rotas principais

- Home: `/`
- Login: `/login`
- Esqueci senha: `/forgot-password`
- Redefinir senha: `/reset-password?token=...`
- Painel admin: `/admin`
- Area cliente: `/cliente`

## Scripts uteis

- `npm run dev` - sobe ambiente de desenvolvimento
- `npm run lint` - valida codigo
- `npm run test:auth-reset` - executa testes de integração do fluxo de recuperação de senha em banco isolado
- `npm run prisma:migrate` - aplica migracoes
- `npm run prisma:seed` - popula usuarios padrao
- `npm run db:setup` - migrate + seed em um comando
- `npm run maintenance:cleanup-reset-tokens` - remove tokens de reset expirados/usados antigos

## Observacoes de arquitetura

- ORM: Prisma + SQLite (MVP local)
- Sessao: cookie httpOnly com token no banco
- Recuperacao de senha:
  - token seguro com hash SHA-256 e expira em 30 minutos
  - token de uso unico
  - sessoes anteriores sao invalidadas apos redefinicao
  - rate limiting por IP e por e-mail no endpoint de solicitacao
- Upload: imagem convertida para `.webp` com `sharp` em `public/uploads/vehicles`
- Protecao de acesso:
  - APIs admin exigem usuario com role `ADMIN`
  - paginas `/admin` e `/cliente` validam sessao e role no servidor

## Configuracao de e-mail (recuperacao de senha)

Crie seu `.env` a partir do `.env.example` e configure:

- `APP_URL`: URL base da aplicacao para gerar o link de reset
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_SECURE` (`true` para 465, `false` para 587/TLS)

Sem SMTP configurado, a aplicacao nao quebra em desenvolvimento: o link de reset sera exibido no log do servidor para teste local.
