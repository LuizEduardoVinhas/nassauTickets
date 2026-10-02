# 🚀 NassauTickets - Backend API

Backend desenvolvido em **Node.js LTS com Express** e **MySQL 8.0** para o **nassauTickets**, um Sistema de Controle de Atendimento para laboratórios de análises clínicas[cite: 25].

---

## 📋 Sumário
1. [Visão Geral](#visão-geral)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Configuração e Execução](#configuração-e-execução)
5. [Endpoints da API](#endpoints-da-api)
6. [Regras de Negócio e Concorrência](#regras-de-negócio-e-concorrência)

---

## 🔍 Visão Geral
O backend é responsável por gerir a lógica de emissão de senhas anônimas pelo totem, processar a fila de atendimento respeitando as regras estritas de prioridade intercalada (`[SP] -> [SE|SG]`), controlar os estados dos bilhetes por meio de transações seguras no banco de dados e fornecer os dados para o painel de chamadas[cite: 17, 19, 25].

---

## 🛠 Arquitetura e Tecnologias
* **Node.js LTS (Express):** Framework rápido e leve para construção da API REST[cite: 25].
* **MySQL 8.0:** Base de dados relacional para persistência dos tickets, utilizadores e logs de auditoria[cite: 25].
* **`mysql2/promise`:** Driver assíncrono com suporte a conexões em pool (`connectionPool`) e transações ACID (`BEGIN`, `COMMIT`, `ROLLBACK`, `FOR UPDATE`)[cite: 25, 29].
* **Padrão Controller-Service:** Separação clara entre o tratamento de requisições HTTP e a execução das regras de negócio[cite: 28].

---

## 📂 Estrutura de Pastas
```text
backend/
├── src/
│   ├── config/
│   │   └── database.js         # Configuração e pool de conexão com o MySQL
│   ├── controllers/
│   │   ├── healthController.js # Endpoint de verificação de saúde da API
│   │   └── ticketController.js # Controladores de emissão, chamada e painel
│   ├── routes/
│   │   ├── healthRoutes.js     # Rotas de saúde (/api/health)
│   │   └── ticketRoutes.js     # Rotas de tickets (/api/tickets/*)
│   └── services/
│       └── ticketService.js    # Lógica de filas, transações e prioridades
├── .env                        # Variáveis de ambiente
├── package.json                # Dependências e scripts do projeto
├── schema.sql                  # Script de criação da base de dados e tabelas
└── server.js                   # Ponto de entrada da aplicação Express

```

---

## ⚙️ Configuração e Execução

### Pré-requisitos

* Node.js instalado (versão 22 LTS recomendada).


* Servidor MySQL 8.0 ativo localmente ou em nuvem.



### 1. Instalação de Dependências

Na pasta `backend/`, execute o seguinte comando no terminal:

```bash
npm install

```

### 2. Configuração do Ambiente (`.env`)

Crie um arquivo `.env` na raiz da pasta `backend/` com as seguintes credenciais de acesso ao banco de dados:

```env
PORT=3003
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=nassauTickets
DB_PORT=3306

```

### 3. Criação do Banco de Dados

Execute o script contido em `schema.sql` no seu **MySQL Workbench** para criar o banco de dados `nassauTickets`, as tabelas e os índices de otimização.

### 4. Executando o Servidor

Para iniciar a API em modo de desenvolvimento (com recarregamento automático via `nodemon` ou execução padrão):

```bash
npm run dev
# ou
node server.js

```

A API estará acessível em `http://localhost:3003`.

---

## 🔌 Endpoints da API

### 1. Verificação de Saúde (`Health Check`)

* **`GET /api/health`**
* **Descrição:** Testa a integridade da API e a conectividade com o pool do MySQL.





### 2. Emissão de Senhas (Totem)

* **`POST /api/tickets/emissao`**
* **Descrição:** Gera um novo bilhete anônimo seguindo o formato `YYMMDD-PPSQ`.


* **Body (JSON):**
```json
{
  "tipo": "SP"
}

```


(Tipos aceitos: `SP` - Prioritária, `SG` - Geral, `SE` - Exames).





### 3. Chamada de Senha (Atendente)

* **`POST /api/tickets/chamar-proximo`**
* **Descrição:** Seleciona o próximo cliente da fila considerando a regra de prioridade intercalada e bloqueia a linha com `FOR UPDATE` para evitar condições de corrida (*race conditions*).


* **Body (JSON):**
```json
{
  "guiche_id": 1,
  "atendente_id": 1
}

```





### 4. Painel de Chamadas

* **`GET /api/tickets/painel`**
* **Descrição:** Retorna as últimas senhas chamadas para exibição no painel geral.





---

## 🔒 Regras de Negócio e Concorrência

* **Priorização Intercalada:** O algoritmo de atendimento segue rigorosamente a ordem dinâmica `[SP] -> [SE|SG] -> [SP] -> [SE|SG]`.


* **Tratamento de Concorrência:** Utiliza transações ACID isoladas com travamento de registos (`SELECT ... FOR UPDATE`) no MySQL, garantindo que dois atendentes nunca consigam puxar a mesma senha simultaneamente.



```

```