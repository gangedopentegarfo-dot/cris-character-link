# CRIS Character Link — MVP 0.1

Extensão experimental para Owlbear Rodeo.

## O que esta versão faz
- Integra-se ao Owlbear Rodeo pelo SDK oficial.
- Adiciona opções ao menu de contexto de tokens da camada CHARACTER.
- Permite vincular dados de PV, SAN e PE ao metadata do token.
- Importa uma ficha por JSON.
- Persiste os dados no token e sincroniza pelo Owlbear.
- Desenha três barras coloridas como itens ATTACHMENT associados ao token; elas acompanham o token quando movido.
- Alterna a visibilidade das barras pelo menu de contexto.

## O que ainda NÃO faz
- Não autentica no CRIS nem lê automaticamente a ficha do site. O repositório público da extensão CRIS-Owlbear fornecida abre o CRIS em um popover; ele não expõe os dados da ficha a outras extensões.
- O carregamento de dados reais do CRIS precisa de uma API/exportação suportada ou integração autorizada. Não forneça senha do CRIS aqui.
- A renderização foi construída com os builders de Shape/Attachment do SDK, mas precisa ser testada numa sala real (desktop e Android); não foi possível executar uma sessão Owlbear nesta etapa.

## Publicar no GitHub Pages
1. Baixe e extraia o ZIP.
2. Crie um repositório público no GitHub chamado `cris-character-link`.
3. Envie o conteúdo da pasta para a raiz do repositório (incluindo `manifest.json`, `index.html`, `app.js`, `style.css` e `icons/`).
4. Abra Settings → Pages.
5. Em Build and deployment, escolha Deploy from a branch; branch `main`, pasta `/ (root)`, Save.
6. Aguarde a publicação. O endereço será `https://SEU_USUARIO.github.io/cris-character-link/`.
7. Edite `manifest.json` e troque as URLs `https://SEU_USUARIO.github.io/cris-character-link/` nos campos `icon` e `action.icon` (e o `action.popover` para a URL `.../index.html`). Use URLs completas.
8. Faça commit.
9. No Owlbear Rodeo, abra Extras → Extensions → Add Extension e cole:
   `https://SEU_USUARIO.github.io/cris-character-link/manifest.json`

## Teste inicial
1. Abra a sala do Owlbear e habilite a extensão.
2. Adicione um token à camada CHARACTER e selecione-o.
3. Abra CRIS Link.
4. Preencha o nome e os valores PV/SAN/PE; clique em Salvar dados.
5. Confira se as três barras aparecem logo abaixo do token.
6. Arraste o token: as barras devem acompanhá-lo.
7. Selecione o token e use “Mostrar/ocultar barras”.
8. Feche e reabra a sala para conferir a persistência.
9. Teste com um segundo jogador conectado.

## JSON de teste
```json
{
  "name": "Agente de Teste",
  "pv": 32, "pvMax": 40,
  "san": 18, "sanMax": 35,
  "pe": 12, "peMax": 20
}
```
