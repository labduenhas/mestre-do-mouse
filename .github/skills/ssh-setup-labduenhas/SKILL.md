---
name: ssh-setup-labduenhas
description: "Use when: configuring this repository to push with GitHub account labduenhas@gmail.com over SSH, without changing global default account dduenhas@gmail.com and without browser-based login flows. Includes key generation, host alias strategy, remote update, and verification checklist."
---

# Skill Prompt: Setup SSH para labduenhas neste repositório

Use esta skill para configurar push por SSH com a conta `labduenhas@gmail.com` neste projeto, evitando confusão com a conta padrão `dduenhas@gmail.com`.

---

## Objetivo

Permitir `git push` estável para este repositório sem depender de login web/OAuth e sem alterar identidade global de outros projetos.

---

## Princípios

1. Não alterar `git config --global user.name` ou `git config --global user.email` sem pedido explícito.
2. Não remover credenciais existentes de outras contas.
3. Isolar a configuração SSH no nível de repositório/host alias quando possível.
4. Só alterar remote após validar chave e acesso.

---

## Pré-checagens obrigatórias

Antes de gerar chaves ou trocar remote:

```bash
git remote -v
git status --short --branch
where ssh
where ssh-keygen
```

Checar também se já existe chave dedicada:

```bash
dir $env:USERPROFILE\.ssh
```

---

## Fluxo recomendado

### Etapa 1 — Gerar chave dedicada (se não existir)

Nome recomendado da chave:

- `~/.ssh/id_ed25519_labduenhas`

Comando:

```bash
ssh-keygen -t ed25519 -C "labduenhas@gmail.com" -f "$env:USERPROFILE/.ssh/id_ed25519_labduenhas"
```

### Etapa 2 — Configurar SSH config com alias

Criar/atualizar `~/.ssh/config` com:

```sshconfig
Host github-labduenhas
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_labduenhas
    IdentitiesOnly yes
```

Se já existir bloco para esse alias, reutilizar sem duplicar.

### Etapa 3 — Exibir chave pública para cadastro no GitHub

```bash
Get-Content "$env:USERPROFILE/.ssh/id_ed25519_labduenhas.pub"
```

Orientar cadastro manual em:

- GitHub > Settings > SSH and GPG keys > New SSH key
- Conta alvo: `labduenhas@gmail.com`

### Etapa 4 — Validar handshake SSH

```bash
ssh -T git@github-labduenhas
```

Resultado esperado: mensagem de autenticação bem-sucedida para o usuário `labduenhas`.

### Etapa 5 — Trocar remote somente deste repositório

Converter `origin` para usar alias:

```bash
git remote set-url origin git@github-labduenhas:labduenhas/mestre-do-mouse.git
git remote -v
```

### Etapa 6 — Teste final de envio

```bash
git push origin main
```

---

## Regras de decisão

### Se o handshake falhar

- não trocar remote ainda
- revisar chave pública cadastrada
- revisar alias em `~/.ssh/config`
- repetir `ssh -T git@github-labduenhas`

### Se o remote já estiver em SSH correto

- não sobrescrever
- apenas validar `git push`

### Se houver múltiplos repositórios com contas diferentes

- manter alias separados por conta
- nunca reutilizar o mesmo `IdentityFile` para contas distintas sem confirmação

---

## Ações automáticas permitidas

- gerar chave dedicada
- criar/atualizar bloco de alias em `~/.ssh/config`
- mostrar chave pública para o usuário
- atualizar `origin` deste repositório
- validar handshake e push

### Nunca fazer sem avisar antes

- apagar chaves existentes
- sobrescrever `~/.ssh/config` inteiro
- alterar remotes de outros repositórios
- mudar configurações globais de Git por conveniência

---

## Saída final obrigatória

# Relatório de Setup SSH

## 1. Estado inicial
- remote antes
- existência de chave dedicada

## 2. Alterações aplicadas
- chave criada ou reutilizada
- bloco de `~/.ssh/config` criado/ajustado
- remote atualizado ou preservado

## 3. Validação
- resultado de `ssh -T`
- resultado de `git push`

## 4. Resultado
- repositório apto para push com `labduenhas` via SSH
- pendências manuais, se houver

---

## Prompt curto para invocar a skill

```md
Configure SSH dedicado para a conta labduenhas@gmail.com neste repositório, sem alterar minha conta padrão global. Gere/reuse chave específica, configure alias no ~/.ssh/config, valide handshake com GitHub, ajuste o origin para o alias correto e confirme com git push.
```