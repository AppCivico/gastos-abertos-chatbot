# Guaxi (gastos-abertos-chatbot)

![alt text](https://gallery.mailchimp.com/af2df78bcac96c77cfa3aae07/images/028e2140-157e-4999-ae3e-66420e32b1ab.png "Guaxi")

## Esta documentação está sendo aprimorada

### Subindo em ambiente de desenvolvimento

Instale os helpers
> npm install -g sequelize-cli nodemon

Instale as dependências
> npm install

Crie o banco de dados
> createdb -h localhost -U postgres gastos_abertos_dev

Efetue as migrations do Sequelize
> sequelize db:migrate

Inicie a aplicação
> nodemon app/app.js
