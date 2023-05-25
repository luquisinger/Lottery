//biblioteca padrao do node
const assert = require('assert');
//ganache é a rede de testes local, criada para rodar testes
const ganache = require('ganache-cli');
const Web3 = require('web3');
//o provider é o q nos permite conectar a qqr rede
const web3 = new Web3(ganache.provider());
//interface é a ABI
//bycode compilador do contrato para linuguagem de computador
const { interface, bytecode } = require('../compile');

//variavel local
//serve para guarda a instancia do contrato
let lottery;
//guarda a lista de todas as contas que sao geradas e desbloqueadas pelo ganache-cli
let accounts;

//implementa o contrato e mostra uma lista das contas usadas
beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(JSON.parse(interface))
    //pega o contrato puro
        .deploy({ data: bytecode })
    //manda pra rede local na forma de transacao
        .send({ from: accounts[0], gas: '1000000'})
});

describe('Lottery Contract', () => {
//cada IT vai testar algum aspecto do contrato
    it('deploys a contract', ()=>{
//assert verifica se existe lottery.options.address
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async () => {
        //entra na loteria
        await lottery.methods.enter().send({
            //quem tenta entrar e qto vai pagar
            from: accounts[0],
            //esse metodo converte eth em wei
            value: web3.utils.toWei('0.02', 'ether')
        });
//certifica de o n apropriado de enderecos esta no getPlayers
        const players = await lottery.methods.getPlayers().call({
            //quem chama essa funcao
            from: accounts[0]
        });
        //certifica q há apenas 1 entrada no array
        assert.equal(accounts[0], players[0]);
        //certifica q o endereco correto esta dentro do array
        //mostrado o vlr q deveria ser e o vlr q é
        assert.equal(1, players.length);
    });
    it('allows multiple accounts to enter', async () => {
        //entra na loteria
        await lottery.methods.enter().send({
            //quem tenta entrar e qto vai pagar
            from: accounts[0],
            //esse metodo converte eth em wei
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            //quem tenta entrar e qto vai pagar
            from: accounts[1],
            //esse metodo converte eth em wei
            value: web3.utils.toWei('0.02', 'ether')
        });
        await lottery.methods.enter().send({
            //quem tenta entrar e qto vai pagar
            from: accounts[2],
            //esse metodo converte eth em wei
            value: web3.utils.toWei('0.02', 'ether')
        });
//certifica de o n apropriado de enderecos esta no getPlayers
        const players = await lottery.methods.getPlayers().call({
            //quem chama essa funcao
            from: accounts[0]
        });
        //certifica q há 3 entrada no array
        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        //certifica q o endereco correto esta dentro do array
        //mostrado o vlr q deveria ser e o vlr q é
        assert.equal(3, players.length);
    });

//certifica q o usuario mande a qtdd apropriada de eth p/a loteria
    it('requires a minimum amount of eth to enter', async ()=>{
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 0
            });
            assert(false);
        } catch (err){
            assert(err);
        }
    });
//se alguma conta n gerente chama o vencedor vai chamar um erro

    it('only manager can call pickWinner', async ()=>{
//n vai precisar entrar no contrato pq pickwinner é restricted
        try{
            await lottery.methods.pickWinner().send({
                from: accounts[1]
            });
            assert(false);
        } catch (err) {
            assert(err);
        }
    });
//esse teste roda todo o contrato 
    it('sends money to the winner and resets the players array', async ()=>{
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });
//web3.eth.getBalance(accounts[0]) descobre qto de eth a conta tem
        const initialBalance = await web3.eth.getBalance(accounts[0]);
//escolhe o vencedor
        await lottery.methods.pickWinner().send({ from: accounts[0]});
        
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;
        assert(difference > web3.utils.toWei('1.8', 'ether'));
    });
});