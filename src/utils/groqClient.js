import Groq from "groq-sdk";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// 🔍 DIAGNÓSTICO
console.log("🔑 ESTADO API KEY:", GROQ_API_KEY ? "✅ Cargada correctamente" : "❌ NO ENCONTRADA");

const groq = new Groq({ 
    apiKey: GROQ_API_KEY, 
    dangerouslyAllowBrowser: true 
});

// --- 🧠 CEREBRO MAESTRO: MISTER CAMBIO ---
export const interpretVoiceCommandAI = async (messagesHistoryOrText) => {
    if (!GROQ_API_KEY) return null;

    const messages = typeof messagesHistoryOrText === 'string' 
        ? [{ role: "user", content: messagesHistoryOrText }]
        : messagesHistoryOrText;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Eres "Mister Cambio", el asistente IA de la app "TasasAlDía". Eres un experto financiero venezolano, amable, preciso y muy servicial. Tu propósito es ayudar a los usuarios a realizar cálculos de divisas de forma rápida y natural.

CONTEXTO CLAVE DE LA APP:
- La app calcula tasas entre Bolívares (VES), Dólares (USD/BCV), Tether (USDT) y Euros (EUR).
- La conversión más común que hacen los usuarios es de Dólares (USD/USDT) a Bolívares (VES).

TU TRABAJO:
Analizar la petición del usuario, incluso si es informal, y extraer los datos clave en un formato JSON. Debes ser muy preciso e inteligente para interpretar la intención del usuario.

REGLAS DE INTERPRETACIÓN:
1.  **INFERENCIA DE MONEDA DE ORIGEN (currency):**
    - "USDT", "Tether", "Binance", "P2P" => "USDT"
    - "Dólar", "$", "USD", "BCV", "Banco Central", "Efectivo", "Verdes" => "USD"
    - "Euro", "Euros", "€" => "EUR"
    - "Bolívares", "Bs", "Bolos" => "VES"

2.  **INFERENCIA DE MONEDA DE DESTINO (targetCurrency):**
    - **PRIORIDAD 1:** Si el usuario especifica claramente una moneda de destino (ej: "a bolívares", "en usdt", "pasalos a dolares"), ESA ES LA QUE DEBES USAR.
    - **PRIORIDAD 2 (POR DEFECTO):** Si el usuario NO especifica un destino, usa estas reglas:
        - Si el origen es "USD" o "USDT", el destino por defecto es "VES".
        - Si el origen es "VES", el destino por defecto es "USD".
        - Si el origen es "EUR", el destino por defecto es "VES".

3.  **IDENTIFICACIÓN DE INTENCIÓN (intent):**
    - Si el usuario dice "invierte", "al revés", "swap", "cambia el orden" o similar, el intent es "invertir".
    - En todos los demás casos, el intent es "calcular".

4.  **EXTRACCIÓN DE NOMBRE DE CLIENTE (clientName):**
    - Si el usuario menciona "para Maria", "a nombre de Pedro", "cliente Juan", etc., extrae ese nombre.

ESTRUCTURA DE RESPUESTA JSON (OBLIGATORIA):
Debes responder ÚNICAMENTE con el objeto JSON, sin explicaciones ni texto adicional.

{
  "intent": "calcular" | "invertir",
  "amount": number | null,
  "currency": "USD" | "USDT" | "VES" | "EUR" | null,
  "targetCurrency": "USD" | "USDT" | "VES" | "EUR" | null,
  "clientName": string | null
}

EJEMPLOS CLAVE:
- "100 dolares" -> {"intent": "calcular", "amount": 100, "currency": "USD", "targetCurrency": "VES", "clientName": null}
- "cuanto son 1200$ a usdt" -> {"intent": "calcular", "amount": 1200, "currency": "USD", "targetCurrency": "USDT", "clientName": null}
- "50 euros a dolares" -> {"intent": "calcular", "amount": 50, "currency": "EUR", "targetCurrency": "USD", "clientName": null}
- "20€ en bolívares" -> {"intent": "calcular", "amount": 20, "currency": "EUR", "targetCurrency": "VES", "clientName": null}
- "cuanto es 50 usdt para Juan" -> {"intent": "calcular", "amount": 50, "currency": "USDT", "targetCurrency": "VES", "clientName": "Juan"}
- "1500 bolivares" -> {"intent": "calcular", "amount": 1500, "currency": "VES", "targetCurrency": "USD", "clientName": null}
- "invierte" -> {"intent": "invertir", "amount": null, "currency": null, "targetCurrency": null, "clientName": null}`
                },
                ...messages 
            ],
            model: "llama-3.1-8b-instant", 
            temperature: 0, 
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (e) {
        console.error("Error AI:", e);
        return null;
    }
};

// --- 👁️ VISIÓN (Sin cambios) ---
export const analyzeImageAI = async (base64Image) => {
    if (!GROQ_API_KEY) return null;
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Lee el monto. JSON: { \"amount\": number, \"currency\": \"USD\"|\"USDT\"|\"VES\"|\"EUR\" }" },
                        { type: "image_url", image_url: { url: base64Image } }
                    ]
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0,
            response_format: { type: "json_object" },
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (e) { return null; }
};

// --- ✍️ REDACCIÓN: MISTER CAMBIO AMABLE ---
export const generateSmartMessage = async (account, amountsString, tone, clientName) => {
    if (!GROQ_API_KEY) return null;
    try {
        const safeName = (clientName && clientName.length < 20) ? clientName : "Estimado/a";
        
        const personas = {
            standard: "Mister Cambio: Caballero amable, claro y servicial.",
            formal: "Mister Cambio Ejecutivo: Muy respetuoso y pulcro.",
            amigable: "Mister Cambio de Confianza: Cálido, usa 'Con gusto', 'Mi estimado'.",
            cobrador: "Mister Cambio Firme: Solicita el pago con educación."
        };

        const prompt = `Actúa como "Mister Cambio", el asistente de IA personal de "${account.holder}". Tu misión es redactar un mensaje de cobro claro, profesional y en el tono adecuado para ser enviado por WhatsApp.

PERSONA (ESTILO): Adopta la siguiente personalidad -> ${personas[tone]}

CLIENTE: El mensaje va dirigido a "${safeName}".

ESTRUCTURA DEL MENSAJE (OBLIGATORIA):
1.  **SALUDO INICIAL:** Comienza con un saludo cordial y profesional. Usa el nombre del cliente si está disponible. (Ej: "Hola ${safeName}, te saluda Mister Cambio, asistente de ${account.holder}. Con gusto te comparto los datos para el pago.")
2.  **TOTALES A PAGAR:** Presenta los montos de forma clara y ordenada bajo el título "*Montos a Pagar:*". Usa viñetas (•) para cada moneda.
    ${amountsString}
3.  **DATOS DE PAGO:** Presenta los datos de la cuenta de forma estructurada bajo un título que describa el método (Ej: "*Datos Pago Móvil*"). Incluye todos los detalles relevantes.
    - Método: ${account.type.replace('_', ' ')}
    - Banco/Plataforma: ${account.bank || account.type}
    - Datos: ${account.phone || account.email || account.accountNumber}
    - Titular: ${account.holder}
    - Cédula/RIF: ${account.id || 'N/A'}
4.  **LLAMADO A LA ACCIÓN Y DESPEDIDA:** Finaliza el mensaje indicando al cliente que debe enviar el comprobante y con una despedida amable. (Ej: "Por favor, recuerda enviar el comprobante una vez realizado el pago. ¡Quedo atento, que tengas un excelente día!")

REGLAS ADICIONALES:
- Usa formato de WhatsApp (negritas con *, cursivas con _).
- Mantén un lenguaje español latino, neutro y masculino.
- Sé conciso y directo, pero siempre amable.
- NO inventes información que no se proporciona.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
        });

        return completion.choices[0].message.content;
    } catch (e) { return null; }
};
