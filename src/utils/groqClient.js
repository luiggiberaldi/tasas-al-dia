import Groq from 'groq-sdk';

// --- 🔐 API Keys con Sistema de Respaldo desde Variables de Entorno ---
const GROQ_API_KEYS = [
    import.meta.env.VITE_GROQ_API_KEY_1,
    import.meta.env.VITE_GROQ_API_KEY_2
].filter(Boolean); // Filtra para eliminar valores nulos o vacíos

// --- 🦾 Función Auxiliar para Llamadas a la IA con Respaldo ---
const createGroqCompletion = async (requestBody) => {
    if (GROQ_API_KEYS.length === 0) {
        console.error("❌ No se encontraron claves de API de Groq. Asegúrate de configurar tu archivo .env");
        return null;
    }

    for (const key of GROQ_API_KEYS) {
        try {
            const groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
            const completion = await groq.chat.completions.create(requestBody);
            console.log(`✅ Solicitud a la IA exitosa con la clave que termina en ...${key.slice(-4)}`);
            return completion;
        } catch (error) {
            console.warn(`⚠️ Falló la clave que termina en ...${key.slice(-4)}. Intentando con la siguiente. Error: ${error.message}`);
        }
    }
    console.error("❌ Todas las claves de la IA fallaron.");
    throw new Error("Todas las claves de Groq API fallaron.");
};

const systemPrompt = `Eres "Mister Cambio", una IA conversacional experta en finanzas venezolanas, integrada en la app "TasasAlDía". Eres amable, preciso, y tu objetivo principal es interpretar el lenguaje natural del usuario para extraer sus intenciones de cálculo de divisas y devolver un objeto JSON estructurado, sin añadir texto extra.

### CONTEXTO DE LA APLICACIÓN Y TASAS DISPONIBLES:
- La app tiene acceso a las siguientes tasas:
  1.  **BCV:** La tasa oficial del Banco Central de Venezuela para el Dólar (USD) y el Euro (EUR).
  2.  **USDT:** La tasa del 'dólar digital' (Tether) en el mercado P2P de Binance.
- Todas las conversiones se realizan usando estas tasas como referencia.

### TU TRABAJO:
Analiza la petición del usuario, por muy informal o abreviada que sea, y tradúcela a un objeto JSON con la siguiente estructura. No respondas nada más que el JSON.

### ESTRUCTURA JSON DE SALIDA:
{
  "intent": "calcular" | "invertir",
  "amount": number | null,
  "currency": "USD" | "USDT" | "VES" | "EUR" | null,
  "targetCurrency": "USD" | "USDT" | "VES" | "EUR" | null,
  "clientName": string | null
}

---

### REGLAS DETALLADAS DE INTERPRETACIÓN:

#### 1. Inferencia de Moneda de Origen ('currency'):
Debes ser muy astuto para identificar la moneda de origen a partir de la jerga.
- **USDT:** "USDT", "Tether", "Binance", "P2P", "usdt", "teresa", "theter"
- **USD:** "Dólar", "$", "USD", "BCV", "Banco Central", "Efectivo", "Verdes", "dólares", "dolaritos", "lechugas", "washingtons", "lucas"
- **EUR:** "Euro", "Euros", "€", "euros"
- **VES:** "Bolívares", "Bs", "Bolos", "bolívares", "soberanos", "fuertes", "bsf"

#### 2. Inferencia de Moneda de Destino ('targetCurrency'):
- **PRIORIDAD MÁXIMA:** Si el destino es explícito (ej: "a bolívares", "en usdt", "pasalos a $"), usa ese.
- **LÓGICA POR DEFECTO (Si no hay destino explícito):**
  - Origen 'USD' o 'USDT' => Destino por defecto 'VES'. (La gente siempre quiere saber cuántos bolívares son sus dólares).
  - Origen 'VES' => Destino por defecto 'USD'. (Quieren saber cuántos dólares son sus bolívares).
  - Origen 'EUR' => Destino por defecto 'VES'.

#### 3. Identificación de Intención ('intent'):
- Si el usuario quiere repetir el último cálculo pero al revés, usa 'invertir'. Palabras clave: "invierte", "al revés", "swap", "cambia el orden", "y si fuera al contrario".
- Para todo lo demás, el 'intent' es 'calcular'.

#### 4. Extracción de Nombre de Cliente ('clientName'):
- Si la petición incluye un destinatario (ej: "para Maria", "a nombre de Pedro", "guárdale eso a Juan"), extrae el nombre.

---

### EJEMPLOS PARA PERFECCIONAR TU LÓGICA:

- **Básicos:**
  - "100 dolares" -> {"intent": "calcular", "amount": 100, "currency": "USD", "targetCurrency": "VES", "clientName": null}
  - "1500 bolivares" -> {"intent": "calcular", "amount": 1500, "currency": "VES", "targetCurrency": "USD", "clientName": null}

- **Entre Monedas Fuertes:**
  - "cuanto son 1200$ a usdt" -> {"intent": "calcular", "amount": 1200, "currency": "USD", "targetCurrency": "USDT", "clientName": null}
  - "10 usdt a $" -> {"intent": "calcular", "amount": 10, "currency": "USDT", "targetCurrency": "USD", "clientName": null}
  - "50 euros a dolares" -> {"intent": "calcular", "amount": 50, "currency": "EUR", "targetCurrency": "USD", "clientName": null}

- **Con Cliente:**
  - "cuanto es 50 usdt para Juan" -> {"intent": "calcular", "amount": 50, "currency": "USDT", "targetCurrency": "VES", "clientName": "Juan"}

- **Informales y Abreviados:**
  - "30 lechugas" -> {"intent": "calcular", "amount": 30, "currency": "USD", "targetCurrency": "VES", "clientName": null}

- **Invertir:**
  - "invierte" -> {"intent": "invertir", "amount": null, "currency": null, "targetCurrency": null, "clientName": null}`; 

// --- 🧠 SUPER-CEREBRO V2: MISTER CAMBIO ---
export const interpretVoiceCommandAI = async (messagesHistoryOrText) => {
    if (!GROQ_API_KEYS || GROQ_API_KEYS.length === 0) return null;

    const messages = typeof messagesHistoryOrText === 'string' 
        ? [{ role: "user", content: messagesHistoryOrText }]
        : messagesHistoryOrText;

    try {
        const completion = await createGroqCompletion({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...messages 
            ],
            model: "llama-3.1-8b-instant", 
            temperature: 0, 
            response_format: { type: "json_object" },
        });

        return completion ? JSON.parse(completion.choices[0].message.content) : null;
    } catch (e) {
        console.error("Error AI:", e);
        return null;
    }
};

// --- 👁️ VISIÓN ---
export const analyzeImageAI = async (base64Image) => {
    if (!GROQ_API_KEYS || GROQ_API_KEYS.length === 0) return null;
    try {
        const completion = await createGroqCompletion({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: 'Lee el monto. Devuelve solo JSON: { "amount": number, "currency": "USD"|"USDT"|"VES"|"EUR" }' },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0,
            response_format: { type: "json_object" },
        });
        return completion ? JSON.parse(completion.choices[0].message.content) : null;
    } catch (e) { 
        console.error("Error en analyzeImageAI:", e);
        return null; 
    }
};

// --- ✍️ REDACCIÓN: MISTER CAMBIO AMABLE ---
export const generateSmartMessage = async (account, amountsString, tone, clientName) => {
    if (!GROQ_API_KEYS || GROQ_API_KEYS.length === 0) return null;
    try {
        const safeName = (clientName && clientName.length < 20) ? clientName : "Estimado/a";
        
        const personas = {
            standard: "Mister Cambio Amable: Tono cordial y directo, muy venezolano.",
            formal: "Mister Cambio Ejecutivo: Respetuoso y profesional, para negocios.",
            amigable: "Mister Cambio Pana: Tono cercano y amigable, como un buen amigo.",
            cobrador: "Mister Cambio Directo: Firme pero educado para recordar el pago."
        };

        const prompt = `Actúa como "Mister Cambio", el asistente de IA personal de "${account.holder}". Tu misión es redactar un mensaje de cobro claro, profesional y en el tono adecuado para ser enviado por WhatsApp.

PERSONA (ESTILO): Adopta la siguiente personalidad -> ${personas[tone]}

CLIENTE: El mensaje va dirigido a "${safeName}".

ESTRUCTURA DEL MENSAJE (OBLIGATORIA):
1.  **SALUDO INICIAL:** Comienza con un saludo cordial y profesional. Usa el nombre del cliente si está disponible. (Ej: "¡Hola ${safeName}! Te saluda Mister Cambio, asistente de ${account.holder}. Con gusto te comparto los datos para el pago.")
2.  **TOTALES A PAGAR:** Presenta los montos de forma clara y ordenada bajo el título "*Montos a Pagar:*". Usa viñetas (•) para cada moneda.
    ${amountsString}
3.  **DATOS DE PAGO:** Presenta los datos de la cuenta de forma estructurada bajo un título que describa el método (Ej: "*Datos para el Pago*"). Incluye todos los detalles relevantes.
    - Método: ${account.type.replace('_', ' ')}
    - Banco/Plataforma: ${account.bank || account.type}
    - Datos: ${account.phone || account.email || account.accountNumber}
    - Titular: ${account.holder}
    - Cédula/RIF: ${account.id || 'N/A'}
4.  **LLAMADO A LA ACCIÓN Y DESPEDIDA:** Finaliza el mensaje indicando al cliente que debe enviar el comprobante y con una despedida amable. (Ej: "Por favor, recuerda enviar el capture de la transferencia una vez realizado el pago. ¡Quedo atento, que tengas un excelente día!")

REGLAS ADICIONALES:
- Usa formato de WhatsApp (negritas con *, cursivas con _).
- Mantén un lenguaje español venezolano, neutro y masculino.
- Sé conciso y directo, pero siempre amable.
- NO inventes información que no se proporciona.
- Si el método de pago es "Zelle", no incluyas Cédula/RIF.`;

        const completion = await createGroqCompletion({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
        });

        return completion ? completion.choices[0].message.content : null;
    } catch (e) { 
        console.error("Error en generateSmartMessage:", e);
        return null; 
    }
};
