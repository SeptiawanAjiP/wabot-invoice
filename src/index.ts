import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import easyinvoice, { InvoiceData } from "easyinvoice";
//@ts-ignore
import stringExtractor from "string-extractor";

const data: InvoiceData = {
  customize: {},
  images: {
    logo: "https://public.easyinvoice.cloud/img/logo_en_original.png",
    background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
  },
  // Your own data
  sender: {
    company: "dewakoding",
    address: "Jl. Raya",
    zip: "123141",
    city: "Jakarta",
    country: "Indonesia",
  },
  // Your recipient
  client: undefined,
  information: {
    number: "001",
    date: "12-12-2021",
    "due-date": "31-12-2021",
  },
  products: undefined,
  "bottom-notice":
    "Terimakasih sudah mempercayakan pembuatan sistem di dewakoding.com",
  settings: {
    currency: "IDR",
  },
  translate: {},
};

async function connectToWhatsApp() {
  console.log("mulai");
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });
  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(
        "connection closed due to ",
        lastDisconnect?.error,
        ", reconnecting ",
        shouldReconnect
      );
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("opened connection");
    }
  });
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
   
    if (!msg.key.fromMe && m.type === "notify") {
      if (
        msg.message?.conversation?.toLowerCase().includes("form invoice") ||
        msg.message?.extendedTextMessage?.text
          ?.toLocaleLowerCase()
          .includes("form invoice")
      ) {
        const pattern =
          'Form Invoice\n\nSilakan isi data dibawah ini\n\nNama Client : {{namaClient}}\nAlamat Client : {{alamatClient}}\nProject : {{project}}\nTotal Pembayaran : {{price}}';
        
        const opts = { ignoreCase: true };
        const extract = stringExtractor(pattern, opts);
        const text = msg.message?.extendedTextMessage?.text?.toString() ?? msg.message?.conversation?.toString()


        const { namaClient,alamatClient, project, price } = await extract(
          msg.message?.extendedTextMessage?.text
        )
        
        data.client = {
          company: namaClient,
          address: alamatClient,
          zip: "",
          city: "",
          country: "Indonesia",
        };

        data.products = [
          {
            quantity: "1",
            description: project,
            "tax-rate": 0,
            price: price,
          },
        ];

        try {
            easyinvoice.createInvoice(data, async function (result) {
                const str = Buffer.from(result.pdf, "base64");
                const mediaMessage = {
                  document: str,
                  mimetype: "application/pdf",
                  fileName: namaClient + ".pdf",
                };
                await sock.sendMessage(msg.key.remoteJid!, mediaMessage);
              });
        } catch(e) {
            console.log(e)
        }
        
      } else {
        await sock.sendMessage(msg.key.remoteJid!, {
          text: `Form Invoice\n\nSilakan isi data dibawah ini\n\nNama Client : \nAlamat Client : \nProject : \nTotal Pembayaran : `,
        });
      }
    }
  });
}

connectToWhatsApp();
