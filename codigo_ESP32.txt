#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BMP280.h>
#include <WiFi.h>

const char* ssid = "Nome_da_rede";
const char* password = "Senha_da_rede";

WiFiServer server(80);

String header;

unsigned long currentTime = millis();
unsigned long previousTime = 0; 
const long timeoutTime = 2000;

// Objeto BMP280
Adafruit_BMP280 bmp;

void setup() {
  Serial.begin(115200);

  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Configurar CORS
  server.setNoDelay(true);
  server.begin();

  // Ajuste os pinos SDA e SCL conforme necessário
  Wire.begin(21, 22);

  // Inicializa o sensor BMP280
  if (!bmp.begin(0x76)) {
    Serial.println("Could not find a valid BMP280 sensor, check wiring!");
    while (1);
  }

}

void loop() {
  WiFiClient client = server.available();

  if (client) {                             
    currentTime = millis();
    previousTime = currentTime;
    Serial.println("New Client.");          
    String currentLine = "";                
    while (client.connected() && currentTime - previousTime <= timeoutTime) {  
      currentTime = millis();
      if (client.available()) {             
        char c = client.read();             
        Serial.write(c);                    
        header += c;
        if (c == '\n') {                    
          if (currentLine.length() == 0) {
            // Adicionar cabeçalhos CORS
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type: application/json");
            client.println("Access-Control-Allow-Origin: *");
            client.println("Access-Control-Allow-Methods: GET, POST, OPTIONS");
            client.println("Access-Control-Allow-Headers: *");
            client.println("Connection: close");
            client.println();

            // Lê a temperatura do BMP280
            float temperatura = bmp.readTemperature();
            // Cria e envia o JSON com a temperatura
            client.print("{\"temperatura\": ");
            client.print(temperatura);
            client.println("}");

            client.println();
            break;
          } else {
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }
    
    header = "";
    client.stop();
    Serial.println("Client disconnected.");
    Serial.println("");
  }
}
