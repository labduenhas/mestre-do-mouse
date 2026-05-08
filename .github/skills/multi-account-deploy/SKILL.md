---
name: multi-account-deploy
description: "Use when: deploying this app with GitHub and Vercel across multiple accounts, especially when dduenhas@gmail.com should remain the default and labduenhas@gmail.com must be used only intentionally for git push, Vercel login, linking, or production deploy. Handles GitHub auth, Vercel auth, remote validation, account mismatch detection, PAT/SSH fallback, and a final deploy checklist."
---

# Skill Prompt: Deploy com Múltiplas Contas GitHub e Vercel

Use esta skill quando o objetivo for publicar este projeto sem cair na confusão de contas diferentes entre GitHub e Vercel.

O cenário padrão é este:

- a conta preferida para permanecer logada no ambiente é `dduenhas@gmail.com`
- a conta excepcional para este projeto pode ser `labduenhas@gmail.com`
- o usuário GitHub padrão detectado no ambiente é `dduenhas`
- a conta Vercel padrão detectada no ambiente é `dduenhas`, com escopo ativo `dduenhas-projects`
- o deploy só deve prosseguir quando a conta ativa estiver explicitamente validada para o alvo atual

---

## Papel da skill

Você é um **orquestrador de deploy com isolamento de identidade**, responsável por evitar pushes, links ou deploys feitos com a conta errada.

Seu trabalho é:

1. Descobrir qual conta GitHub e qual conta Vercel devem ser usadas neste projeto.
2. Verificar qual conta está ativa no ambiente antes de qualquer ação destrutiva.
3. Preferir fluxos que **não dependam do navegador padrão** do sistema.
4. Guiar ou executar autenticação segura por `PAT`, `SSH`, `gh auth`, `vercel login`, ou `vercel switch`.
5. Só executar `git push`, `vercel link`, `vercel deploy` ou `vercel --prod` depois de validar conta, remote e projeto.
6. Entregar um relatório final curto com estado de autenticação, ações executadas e próximos passos.

---

## Princípio operacional

Esta skill deve assumir que:

- `dduenhas@gmail.com` é a identidade padrão do ambiente;
- `labduenhas@gmail.com` só deve ser usada quando o projeto realmente exigir;
- trocar de conta sem confirmação explícita é um erro operacional;
- login por browser default é a última opção, não a primeira.

Se houver qualquer ambiguidade entre conta ativa e conta esperada, a skill deve parar o deploy e explicar o conflito.

## Perfil local conhecido deste repositório

Use estes valores como defaults operacionais, até que o usuário informe o contrário:

- **GitHub padrão do ambiente**: `dduenhas` (`dduenhas@gmail.com`)
- **GitHub excepcional deste projeto**: `labduenhas` (`labduenhas@gmail.com`)
- **Vercel padrão do ambiente**: `dduenhas`
- **Escopo Vercel padrão detectado**: `dduenhas-projects`

Ao preparar deploy para a conta excepcional, a skill deve declarar explicitamente:

1. conta atual detectada
2. conta alvo solicitada
3. método de troca de autenticação escolhido (`PAT`, `SSH`, `token` ou `switch`)

---

## Entradas esperadas

Sempre tente descobrir ou confirmar:

- repositório remoto do GitHub
- branch alvo
- conta GitHub esperada para o push
- conta Vercel esperada para o deploy
- nome do projeto na Vercel, se houver
- se já existe `.vercel/project.json`
- se o deploy desejado é preview ou produção
- se o usuário quer autenticar por `PAT`, `SSH`, `device flow`, ou já está autenticado

Se parte dessas informações estiver faltando, descubra primeiro no repositório e no ambiente antes de perguntar.

---

## Ordem obrigatória de execução

### Etapa 1 — Descoberta local

Verifique no workspace:

- `package.json`
- `README.md`
- `.git/config` de forma indireta via `git remote -v`
- presença de `.vercel/`
- presença de `vercel.json`
- scripts de build e deploy

Identifique:

- stack do projeto
- branch atual
- remote `origin`
- se já existe integração prévia com Vercel

### Etapa 2 — Identidade GitHub ativa

Antes de qualquer `push`, verifique:

```bash
git config user.name
git config user.email
gh auth status
git remote -v
git status --short --branch
```

Classifique o estado em uma destas categorias:

- **GitHub OK**: conta ativa bate com a esperada para este repositório
- **GitHub divergente**: conta ativa é diferente da esperada
- **GitHub indefinido**: não há auth suficiente para concluir push

### Etapa 3 — Identidade Vercel ativa

Antes de qualquer `deploy`, verifique:

```bash
vercel whoami
vercel switch
vercel link
vercel project ls
```

Use somente comandos compatíveis com o contexto atual. Se a CLI não estiver instalada ou autenticada, registre isso com clareza.

Classifique o estado em uma destas categorias:

- **Vercel OK**: conta e projeto corretos
- **Vercel divergente**: conta ativa diferente da esperada
- **Vercel indefinido**: CLI ausente ou auth ausente

Se `vercel whoami` retornar `dduenhas` e o escopo ativo for `dduenhas-projects`, trate isso como baseline esperado do ambiente, não como alvo automático de deploy.

### Etapa 4 — Escolha do método de autenticação

A skill deve seguir esta prioridade quando a conta correta não estiver ativa:

1. `PAT` colado no terminal
2. `SSH` com remote específico do repositório
3. `gh auth login --with-token`
4. `git credential-manager github login --device --no-ui`, se realmente expuser código utilizável
5. browser default, apenas como último recurso

Para Vercel, priorize:

1. `vercel switch`, se a conta já existir localmente
2. token por variável de ambiente ou prompt seguro
3. `vercel login`, evitando depender do browser padrão quando houver alternativa

---

## Regras rígidas de segurança e operação

### Regra 1 — Nunca assumir conta correta

Mesmo que o remote contenha `labduenhas`, a skill deve verificar autenticação real antes do push.

### Regra 2 — Nunca abrir login web como primeira tentativa

Se houver `PAT`, `SSH`, `token`, `gh`, ou `vercel switch`, use essas opções antes do browser.

### Regra 3 — Não sobrescrever identidade global sem necessidade

Evite alterar `git config --global user.email` e `git config --global user.name` quando o problema é apenas deste projeto.

Prefira configurações locais do repositório, quando necessário:

```bash
git config user.name "Lab Duenhas"
git config user.email "labduenhas@gmail.com"
```

### Regra 4 — Não trocar remote para outra conta sem checagem explícita

Antes de alterar `origin`, a skill deve mostrar:

- remote atual
- remote proposto
- motivo da troca

### Regra 5 — Validar build antes de deploy

Antes de publicar, a skill deve rodar o build mais estreito possível e registrar se passou.

---

## Heurísticas específicas para este tipo de problema

### Caso A — Push bloqueado por conta errada no GitHub

Sinais comuns:

- `gh auth status` mostra usuário diferente do esperado
- `git push` abre login do browser padrão
- o remote aponta para o repositório correto, mas a autenticação HTTPS está errada

Ação preferencial:

- usar `PAT` ou `SSH`
- evitar reabrir browser default

### Caso B — Repositório certo, identidade Git local certa, auth remota errada

Sinais comuns:

- `git config user.email` correto
- commit local criado com autor correto
- `git push` falha ou pede autenticação de outra conta

Conclusão:

O problema não é autor do commit; o problema é a credencial HTTPS/CLI usada no push.

### Caso C — Conta Vercel errada

Sinais comuns:

- `vercel whoami` retorna outro usuário
- `vercel link` associa o projeto errado
- `vercel deploy` publica em time/projeto diferente

Ação preferencial:

- trocar conta com `vercel switch`
- confirmar projeto antes do deploy

### Caso D — Projeto sem link local com a Vercel

Sinais comuns:

- ausência de `.vercel/project.json`
- `vercel` pede seleção de escopo/projeto

Ação preferencial:

- validar conta ativa primeiro
- só então executar `vercel link`

---

## Fluxos preferenciais

### Fluxo 1 — Push via PAT sem browser default

Use quando a conta correta está logada em outro navegador, mas o terminal não deve abrir OAuth no browser padrão.

Passos:

1. confirmar remote e branch
2. confirmar que há commits locais a enviar
3. orientar o usuário a gerar `PAT` na conta correta
4. autenticar com `gh auth login --with-token` ou helper compatível
5. reexecutar `git push`

### Fluxo 2 — Push via SSH para conta específica

Use quando o usuário quer eliminar confusão recorrente com contas múltiplas.

Passos:

1. verificar existência de chave SSH adequada
2. se necessário, gerar chave dedicada para `labduenhas@gmail.com`
3. orientar a adição da chave no GitHub da conta correta
4. trocar remote HTTPS por SSH somente para este repositório
5. validar com `ssh -T git@github.com`
6. executar `git push`

### Fluxo 3 — Deploy Vercel com conta controlada

Passos:

1. verificar `vercel whoami`
2. verificar se o projeto já está linkado
3. confirmar se o alvo é preview ou produção
4. rodar build local
5. executar `vercel deploy` ou `vercel --prod`
6. registrar URL final do deploy

---

## Ações automáticas permitidas

Esta skill pode:

- inspecionar estado do Git e da Vercel CLI
- validar remote, branch e status
- rodar build local
- orientar ou executar autenticação por token
- orientar configuração SSH
- executar `git push` depois que a conta correta estiver validada
- executar `vercel link` e `vercel deploy` depois de validar conta e projeto
- registrar instruções locais de uso futuro no repositório, se solicitado

### Nunca fazer sem avisar antes

- mudar conta global do sistema por conveniência
- apagar credenciais existentes
- sobrescrever remote para outro repositório sem confirmação
- fazer deploy em produção sem confirmar o alvo
- trocar o time/projeto da Vercel silenciosamente

---

## Checklist obrigatório antes de publicar

Antes de qualquer `push` ou `deploy`, a skill deve responder internamente a estas perguntas:

1. Qual conta GitHub deve ser usada neste projeto?
2. Qual conta GitHub está autenticada agora?
3. Qual conta Vercel deve ser usada neste projeto?
4. Qual conta Vercel está autenticada agora?
5. O remote `origin` aponta para o repositório certo?
6. O projeto da Vercel está corretamente linkado?
7. O build local passou?
8. O destino é preview ou produção?

Se qualquer resposta estiver indefinida, não publicar ainda.

---

## Saída final obrigatória

Sempre termine com estas seções:

# Relatório de Deploy

## 1. Contexto detectado
- branch atual
- remote atual
- stack
- status de build

## 2. Identidade ativa
- conta GitHub detectada
- conta Vercel detectada
- divergências encontradas

## 3. Ações executadas
- autenticação realizada
- comandos executados
- mudanças de configuração local, se houver

## 4. Resultado
- push feito ou não
- deploy feito ou não
- URL final, se houver

## 5. Próximo passo recomendado
- ação objetiva para concluir ou repetir o fluxo com segurança

---

## Frases de invocação recomendadas

Use esta skill quando o usuário disser algo como:

- "faça o deploy desse projeto sem misturar minhas contas"
- "publique isso usando a conta labduenhas, mas sem mexer na conta padrão"
- "prepare o push e o deploy na Vercel com a conta certa"
- "valide GitHub e Vercel antes de publicar"

---

## Prompt curto para invocar a skill

```md
Execute o fluxo de deploy com múltiplas contas neste projeto. Descubra qual conta GitHub e qual conta Vercel devem ser usadas, valide a autenticação ativa antes de qualquer push ou deploy, evite o navegador padrão sempre que possível, prefira PAT/SSH/token em vez de login web, e só publique depois de confirmar remote, projeto, build e destino.
```