const opcua = require("node-opcua");
const { OPCUAServer,dataType, DataType,resolveNodeId,AttributeIds} = require("node-opcua");
const {DataSetFieldContentMask,JsonDataSetMessageContentMask, JsonNetworkMessageContentMask,BrokerTransportQualityOfService, PublishedDataItemsDataType,PubSubConfigurationDataType}=require("node-opcua-types");

const net = require('net');

const server0 = net.createServer();

server0.listen(29999, '192.168.1.3', ()=>{
//server0.listen(29999, '192.168.0.30', ()=>{
    console.log('Server in ascolto sulla porta: ', server0.address().port)
    console.log('Server Address: ', server0.address().address)
});

server0.on('connection', (socket)=>{
    socket.on('data', (data)=>{
        //console.log('Messaggio ricevuto dal Client: ' + data)
        d = data.toString("hex")
        //console.log("Data: " + d)
        var temp = data[0]; // Temperatura
        var press = data[1]; // Pressione
        var stato_forno = data[2]; // Stato Forno
        var pos = data[3]; // Posizione
        var vel = data[4]; // Velocità
        var stato_nastro = data[5]; // Stato Nastro
        
        temp = temp * 10
        press = press * 10
        if(stato_forno == 1){
            stato_forno = 'IDLE'
        }
        if(stato_forno == 2){
            stato_forno = 'ACCENSIONE'
        }
        if(stato_forno == 3){
            stato_forno = 'FUSIONE'
        }
        if(stato_forno == 4){
            stato_forno = 'RAFFREDDAMENTO'
        }

        if(stato_nastro == 1){
            stato_nastro = 'IDLE'
        }
        if(stato_nastro == 2){
            stato_nastro = 'SCORRIMENTO'
        }
        

        console.log("Info Altoforno :");
        console.log("Stato: " + stato_forno);
        console.log("Temperatura = " + temp + " °C");
        console.log("Pressione = " + press + " bar");

        console.log("Info Nastro Trasportatore :");
        console.log("Stato: " + stato_nastro);
        console.log("Posizione = " + pos + " m");
        console.log("Velocità = " + vel + " m/s");

        alto_forno.stato['$dataValue'].value.value = stato_forno;
        alto_forno.temperatura['$dataValue'].value.value = temp;
        alto_forno.pressione['$dataValue'].value.value = press;

        nastro_trasportatore.stato['$dataValue'].value.value = stato_nastro;
        nastro_trasportatore.posizione['$dataValue'].value.value = pos;
        nastro_trasportatore.velocita['$dataValue'].value.value = vel;
        
        
        //console.log("Forno Stato: " + alto_forno.stato['$dataValue'].value.value);
        //console.log("Forno Temp: " + alto_forno.temperatura['$dataValue'].value.value);
        //console.log("Forno Pres: " + alto_forno.pressione['$dataValue'].value.value);
        //console.log("Nastro Stato: " + nastro_trasportatore.stato['$dataValue'].value.value);
        //console.log("Nastro Pos: " + nastro_trasportatore.posizione['$dataValue'].value.value);
        //console.log("Nastro Vel: " + nastro_trasportatore.velocita['$dataValue'].value.value);

        //alto_forno.temperatura['$dataValue'].value.value += 700.50;
        //console.log("Temp modificata: " + alto_forno.temperatura['$dataValue'].value.value);
    });

    socket.on('close', ()=>{
        console.log('Communicazione terminata')
    });

    socket.on('error', (err)=>{
        console.log(err.message)
    });
});

class altoForno{
    constructor(stato, temperatura, pressione){
        this.stato = stato;
        this.temperatura = temperatura;
        this.pressione = pressione;
    }
}

class nastroTrasportatore{
    constructor(stato, posizione, velocita){
        this.stato = stato;
        this.posizione = posizione;
        this.velocita = velocita;
    }
}

var alto_forno = new altoForno('IDLE', 0, 0);
var nastro_trasportatore = new nastroTrasportatore('IDLE', 0, 0);

(async()=>{
    try {

        //const mySensor= await connectedSensor();  
        
        const server = new OPCUAServer({
            port: 26543,
            resourcePath: "/UA/PCServer",
            buildInfo:{
                productName: "PCOpcUaServer",
                buildDate:new Date(),
            }
        });

        await server.initialize();

        const addressSpace = server.engine.addressSpace; // Gestione dei nodi
        const namespace = addressSpace.getOwnNamespace(); 

        const devices = namespace.addFolder("ObjectsFolder", { // Folder
            browseName: "Devices"
        });

        // Organizzazione Altoforno

        const forno = namespace.addObject({ // Object
            organizedBy: addressSpace.rootFolder.objects.devices, // Collega il sensore alla cartella devices
            browseName:"Altoforno"
        })

        const caratteristiche_forno = namespace.addObject({ // Object
            componentOf: forno,
            browseName:"Caratteristiche"
        })

        const sensori_forno = namespace.addObject({ // Object
            componentOf: forno,
            browseName:"Sensori"
        })

        alto_forno.stato = namespace.addVariable({ // Variable
            componentOf: forno,
            browseName: "Stato",
            description:
                {
                    locale:"it-IT",
                    text:"Stato corrente dell'alto forno"
                },
            nodeId: "s=StatoForno", //IDENTIFICATORE CON STRINGA
            dataType: "String",
            value: new opcua.Variant({ dataType: opcua.DataType.String, value: 'IDLE'})
        });

        const altezza = namespace.addVariable({ // Variable
            propertyOf: caratteristiche_forno,
            browseName: "Altezza",
            description:
                {
                    locale:"it-IT",
                    text:"Altezza dell'altoforno [m]"
                },
            nodeId: "s=AltezzaForno", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 80.00})
        });

        const diametro = namespace.addVariable({ // Variable
            propertyOf: caratteristiche_forno,
            browseName: "Diametro",
            description:
                {
                    locale:"it-IT",
                    text:"Diametro dell'altoforno [m]"
                },
            nodeId: "s=DiametroForno", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 8.00})
        });

        alto_forno.temperatura = namespace.addVariable({ // Variable
            componentOf: sensori_forno,
            browseName: "Temperatura",
            description:
                {
                    locale:"it-IT",
                    text:"Temperatura dell'altoforno [°C]"
                },
            nodeId: "s=TemperaturaForno", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 0})
        });

        alto_forno.pressione = namespace.addVariable({ // Variable
            componentOf: sensori_forno,
            browseName: "Pressione",
            description:
                {
                    locale:"it-IT",
                    text:"Pressione dell'altoforno [bar]"
                },
            nodeId: "s=PressioneForno", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 0})
        });

        // ---------------------------------------------------------------------------------------------

        // Organizzazione Nastro Trasportatore

        const nastro = namespace.addObject({ // Object
            organizedBy: addressSpace.rootFolder.objects.devices, // Collega il sensore alla cartella devices
            browseName:"NastroTrasportatore"
        })

        const caratteristiche_nastro = namespace.addObject({ // Object
            componentOf: nastro,
            browseName:"Caratteristiche"
        })

        const sensori_nastro = namespace.addObject({ // Object
            componentOf: nastro,
            browseName:"Sensori"
        })

        nastro_trasportatore.stato = namespace.addVariable({ // Variable
            componentOf: nastro,
            browseName: "Stato",
            description:
                {
                    locale:"it-IT",
                    text:"Stato corrente del nastro trasportatore"
                },
            nodeId: "s=StatoNastro", //IDENTIFICATORE CON STRINGA
            dataType: "String",
            value: new opcua.Variant({ dataType: opcua.DataType.String, value: 'IDLE'})
        });

        const lunghezza = namespace.addVariable({ // Variable
            propertyOf: caratteristiche_nastro,
            browseName: "Lunghezza",
            description:
                {
                    locale:"it-IT",
                    text:"Lunghezza del nastro trasportatore [m]"
                },
            nodeId: "s=LunghezzaNastro", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 5.00})
        });

        const larghezza = namespace.addVariable({ // Variable
            propertyOf: caratteristiche_nastro,
            browseName: "Larghezza",
            description:
                {
                    locale:"it-IT",
                    text:"Larghezza del nastro trasportatore [m]"
                },
            nodeId: "s=LarghezzaNastro", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 1.00})
        });

        nastro_trasportatore.posizione = namespace.addVariable({ // Variable
            componentOf: sensori_nastro,
            browseName: "Posizione",
            description:
                {
                    locale:"it-IT",
                    text:"Posizione del nastro trasportatore [m]"
                },
            nodeId: "s=PosizioneNastro", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 0})
        });

        nastro_trasportatore.velocita = namespace.addVariable({ // Variable
            componentOf: sensori_nastro,
            browseName: "Velocita",
            description:
                {
                    locale:"it-IT",
                    text:"Velocita del nastro trasportatore [m/s]"
                },
            nodeId: "s=VelocitaNastro", //IDENTIFICATORE CON STRINGA
            dataType: "Double",
            value: new opcua.Variant({ dataType: opcua.DataType.Double, value: 0})
        });

        // ---------------------------------------------------------------------------------------------

        // Creazione delle Variabili nell'Address Space

        /*const model = namespace.addVariable({ // Variabile
            propertyOf: sensor,
            browseName: "ModelSensor",
            dataType: "String",
            value: {
                get: function(){
                    return new opcua.Variant({
                        dataType: opcua.DataType.String, // BUILT-IN DATA TYPE
                        value:"One Way Sensor"
                    })
                }
            }
        });*/

        // ---------------------------------------------------------------------------------------------

        await server.start();

        console.log("server started at ", server.getEndpointUrl());
    } catch(err) {
        console.log(err);
        process.exit(1);
    }
})();