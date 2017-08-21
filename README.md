# Guaxi (gastos-abertos-chatbot)

![alt text](https://gallery.mailchimp.com/af2df78bcac96c77cfa3aae07/images/028e2140-157e-4999-ae3e-66420e32b1ab.png "Guaxi")

## Esta documentação está sendo aprimorada

### Subindo em ambiente de desenvolvimento

Instale os helpers
> npm install -g sequelize-cli nodemon dotenv

Instale as dependências
> npm install

Crie o banco de dados
> createdb -h localhost -U postgres gastos_abertos_dev

Efetue as migrations do Sequelize
> sequelize db:migrate --env

Inicie a aplicação
> npm run start:dev

### Subindo em ambiente de produção

Instale os helpers
> npm install -g sequelize-cli dotenv

Instale as dependências
> npm install

Copie o arquivo de envs
> cp example.env .env 

Crie o banco de dados
> createdb -h localhost -U postgres gastos_abertos_prod

Efetue as migrations do Sequelize
> sequelize db:migrate --env production

Construa o container
> chmod +x build-container.sh

Inicie o container
> cp sample-run-container.sh run-container.sh

> chmod +x run-container.sh

> ./run-container.sh
