import kivy, kivymd
from kivy.uix.screenmanager import Screen, ScreenManager, SlideTransition
from kivy.core.window import Window 
from kivy.lang import Builder
from kivymd.app import MDApp
#import opcua
from opcua import Client 
import time
from kivymd.uix.dialog import MDDialog


kivy.require('2.1.0')

class MainScreen(Screen):
    pass

class SelectionScreen(Screen):
    pass

class ManualMonitoringScreen(Screen):
    pass

class AutomaticMonitoringScreen(Screen):
    pass

class Handler(object):
    
    get_root = 0

    def datachange_notification(self, node, val, data):
        print("Python: New data change event", node, val)
        
        if str(node) == 'ns=1;s=StatoForno':
            self.get_root.ids['stato_forno'].text = str(val)
        if str(node) == 'ns=1;s=TemperaturaForno':
            self.get_root.ids['temperatura'].text = str(val) + " °C"
        if str(node) == 'ns=1;s=PressioneForno':
            self.get_root.ids['pressione'].text = str(val) + " bar"
        
        if str(node) == 'ns=1;s=StatoNastro':
            self.get_root.ids['stato_nastro'].text = str(val) 
        if str(node) == 'ns=1;s=PosizioneNastro':
            self.get_root.ids['posizione'].text = str(val) + " m"
        if str(node) == 'ns=1;s=VelocitaNastro':
            self.get_root.ids['velocita'].text = str(val) + " m/s"     

    def set_get_root(self, root):
        self.get_root = root

sm = ScreenManager(transition=SlideTransition())
sm.add_widget(MainScreen(name="mainscreen"))
sm.add_widget(SelectionScreen(name="selectionscreen"))
sm.add_widget(ManualMonitoringScreen(name="manualmonitoringscreen"))
sm.add_widget(AutomaticMonitoringScreen(name="automaticmonitoringscreen"))


indirizzo_server1 = "opc.tcp://"
indirizzo_server2 = "192.168.1.10"
indirizzo_server3 = ":26543/UA/PCServer"
#client = Client("opc.tcp://192.168.1.10:26543/UA/PCServer")



class MainApp(MDApp):

    def build(self):     
       
        self.title = "Progetto"
        self.theme_cls.primary_palette = "Gray"
        Window.size = (360, 640)
        return Builder.load_file('Main.kv')

    def connessione_server(self):
        indirizzo = self.root.get_screen("mainscreen").ids["indirizzoIp"].text
        
        indirizzo_server = indirizzo_server1 + indirizzo + indirizzo_server3
        #print(indirizzo_server)

        self.client = Client(indirizzo_server)
        
        """ Nel caso in cui non si vogliano modificare i parametri di defalut della Session, è possibile richiamare
            quest'ultima in maniera automatica mediante l'utilizzo della connect(). Nel caso in cui si vogliano dei paramentri
            specifici nella Session, bisogna utilizzare activate_session(username, password, certificate)."""

        self.client.connect()
        self.root.current = 'selectionscreen'

    def go_to_selectionscreen(self):
        self.root.current = 'selectionscreen'

    def go_to_manualmonitoringscreen(self):
        self.root.current = 'manualmonitoringscreen'

    def go_to_automaticmonitoringscreen(self):
        self.root.current = 'automaticmonitoringscreen'
        get_root = self.root.get_screen("manualmonitoringscreen")
        
        node_statoforno = self.client.get_node("ns=1;s=StatoForno")
        node_temperatura = self.client.get_node("ns=1;s=TemperaturaForno")
        node_pressione = self.client.get_node("ns=1;s=PressioneForno")
        
        node_statonastro = self.client.get_node("ns=1;s=StatoNastro")
        node_posizione = self.client.get_node("ns=1;s=PosizioneNastro")
        node_velocita = self.client.get_node("ns=1;s=VelocitaNastro")
        
        subhandler = Handler()
        subhandler.set_get_root(self.root.get_screen("automaticmonitoringscreen"))
        sub = self.client.create_subscription(500, subhandler)
        
        """ La funzione subscribe_data_change ha già come meccanismo implicito la creazione dei monitored items, in quanto
            tale funzione richiama a sua volta la funzione _subscribe (riga 218 nel file subscription.py) che si occupa della
            configurazione e della creazione dei monitored items (riga 227 e 230 nel file subscription.py)."""

        handle_statoforno = sub.subscribe_data_change(node_statoforno)
        handle_temperatura = sub.subscribe_data_change(node_temperatura)
        handle_pressione = sub.subscribe_data_change(node_pressione)

        handle_statonastro = sub.subscribe_data_change(node_statonastro)
        handle_posizione = sub.subscribe_data_change(node_posizione)
        handle_velocita = sub.subscribe_data_change(node_velocita)



    def butt_altoforno(self):
        dialog = MDDialog(title="Click STATO per aggiornare i valori dell'Altoforno")
        dialog.open()

    def butt_nastro(self):
        dialog = MDDialog(title="Click STATO per aggiornare i valori del Nastro Trasportatore")
        dialog.open()

    def automatic_button(self):
        dialog = MDDialog(title="Nessuna funzionalità dispinibile: monitoraggio automatico!")
        dialog.open()

    def stato_altoforno(self):
        stato_forno = self.client.get_node("ns=1;s=StatoForno")
        self.root.get_screen("manualmonitoringscreen").ids["stato_forno"].text = str(stato_forno.get_value())

        temp = self.client.get_node("ns=1;s=TemperaturaForno")
        self.root.get_screen("manualmonitoringscreen").ids["temperatura"].text = str(temp.get_value()) + " °C"

        press = self.client.get_node("ns=1;s=PressioneForno")
        self.root.get_screen("manualmonitoringscreen").ids["pressione"].text = str(press.get_value()) + " bar"


    def stato_nastrotrasportatore(self):
        stato_nastro = self.client.get_node("ns=1;s=StatoNastro")
        self.root.get_screen("manualmonitoringscreen").ids["stato_nastro"].text = str(stato_nastro.get_value())

        pos = self.client.get_node("ns=1;s=PosizioneNastro")
        self.root.get_screen("manualmonitoringscreen").ids["posizione"].text = str(pos.get_value()) + " m"

        vel = self.client.get_node("ns=1;s=VelocitaNastro")
        self.root.get_screen("manualmonitoringscreen").ids["velocita"].text = str(vel.get_value()) + " m/s"
        


    def chiusura_connessione(self):
        self.root.current = 'mainscreen'



if __name__ == "__main__":
    MainApp().run()