"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const easyinvoice_1 = __importDefault(require("easyinvoice"));
//@ts-ignore
const string_extractor_1 = __importDefault(require("string-extractor"));
const data = {
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
    "bottom-notice": "Terimakasih sudah mempercayakan pembuatan sistem di dewakoding.com",
    settings: {
        currency: "IDR",
    },
    translate: {},
};
function connectToWhatsApp() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("mulai");
        const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)("auth");
        const sock = (0, baileys_1.default)({
            printQRInTerminal: true,
            auth: state,
        });
        sock.ev.on("creds.update", saveCreds);
        sock.ev.on("connection.update", (update) => {
            var _a, _b;
            const { connection, lastDisconnect } = update;
            if (connection === "close") {
                const shouldReconnect = ((_b = (_a = lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error) === null || _a === void 0 ? void 0 : _a.output) === null || _b === void 0 ? void 0 : _b.statusCode) !==
                    baileys_1.DisconnectReason.loggedOut;
                console.log("connection closed due to ", lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error, ", reconnecting ", shouldReconnect);
                if (shouldReconnect) {
                    connectToWhatsApp();
                }
            }
            else if (connection === "open") {
                console.log("opened connection");
            }
        });
        sock.ev.on("messages.upsert", (m) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const msg = m.messages[0];
            if (!msg.key.fromMe && m.type === "notify") {
                if (((_b = (_a = msg.message) === null || _a === void 0 ? void 0 : _a.conversation) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("form invoice")) ||
                    ((_e = (_d = (_c = msg.message) === null || _c === void 0 ? void 0 : _c.extendedTextMessage) === null || _d === void 0 ? void 0 : _d.text) === null || _e === void 0 ? void 0 : _e.toLocaleLowerCase().includes("form invoice"))) {
                    const pattern = 'Form Invoice\n\nSilakan isi data dibawah ini\n\nNama Client : {{namaClient}}\nAlamat Client : {{alamatClient}}\nProject : {{project}}\nTotal Pembayaran : {{price}}';
                    const opts = { ignoreCase: true };
                    const extract = (0, string_extractor_1.default)(pattern, opts);
                    const text = (_j = (_h = (_g = (_f = msg.message) === null || _f === void 0 ? void 0 : _f.extendedTextMessage) === null || _g === void 0 ? void 0 : _g.text) === null || _h === void 0 ? void 0 : _h.toString()) !== null && _j !== void 0 ? _j : (_l = (_k = msg.message) === null || _k === void 0 ? void 0 : _k.conversation) === null || _l === void 0 ? void 0 : _l.toString();
                    const { namaClient, alamatClient, project, price } = yield extract((_o = (_m = msg.message) === null || _m === void 0 ? void 0 : _m.extendedTextMessage) === null || _o === void 0 ? void 0 : _o.text);
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
                        easyinvoice_1.default.createInvoice(data, function (result) {
                            return __awaiter(this, void 0, void 0, function* () {
                                const str = Buffer.from(result.pdf, "base64");
                                const mediaMessage = {
                                    document: str,
                                    mimetype: "application/pdf",
                                    fileName: namaClient + ".pdf",
                                };
                                yield sock.sendMessage(msg.key.remoteJid, mediaMessage);
                            });
                        });
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                else {
                    yield sock.sendMessage(msg.key.remoteJid, {
                        text: `Form Invoice\n\nSilakan isi data dibawah ini\n\nNama Client : \nAlamat Client : \nProject : \nTotal Pembayaran : `,
                    });
                }
            }
        }));
    });
}
connectToWhatsApp();
