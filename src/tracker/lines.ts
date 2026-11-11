const lines: Record<string, string> = {
  MSCU: "MSC",
  MSDU: "MSC",
  MEDU: "MSC",
  MSC: "MSC",
  MAEU: "ميرسك",
  MRKU: "ميرسك",
  MSKU: "ميرسك",
  MRSU: "ميرسك",
  MNBU: "ميرسك",
  PONU: "ميرسك",
  SEAU: "ميرسك",
  SUDU: "ميرسك",
  MVIU: "ميرسك",
  CMAU: "CMA CGM",
  CGMU: "CMA CGM",
  ECMU: "CMA CGM",
  CMDU: "CMA CGM",
  APHU: "CMA CGM",
  APZU: "CMA CGM",
  ANNU: "CMA CGM",
  CNCU: "CMA CGM",
  APLU: "CMA CGM",
  APRU: "CMA CGM",
  COSU: "كوسكو",
  CBHU: "كوسكو",
  CSNU: "كوسكو",
  CCLU: "كوسكو",
  CSLU: "كوسكو",
  HLCU: "هاباغ لويد",
  HLBU: "هاباغ لويد",
  HLXU: "هاباغ لويد",
  UACU: "هاباغ لويد",
  UASU: "هاباغ لويد",
  ONEU: "ون لاين",
  ONEY: "ون لاين",
  NYKU: "ون لاين",
  MOLU: "ون لاين",
  KKFU: "ون لاين",
  KKLU: "ون لاين",
  EGHU: "إيفرغرين",
  EISU: "إيفرغرين",
  EITU: "إيفرغرين",
  EGSU: "إيفرغرين",
  EMCU: "إيفرغرين",
  EGLV: "إيفرغرين",
  HDMU: "HMM",
  HMMU: "HMM",
  YMLU: "يانغ مينغ",
  YMMU: "يانغ مينغ",
  ZIMU: "زيم",
  ZCSU: "زيم",
  OOLU: "OOCL",
  OOCU: "OOCL",
  WHLU: "وان هاي",
  WHSU: "وان هاي",
  PCIU: "PIL",
  PILU: "PIL",
  PABV: "PIL",
  KMTU: "KMTC",
  SITU: "SITC",
  ARKU: "أركاس",
  ESPU: "الإمارات",
  XPFU: "إكس برس",
  TSLU: "تي إس لاين",
  GSLU: "غولد ستار",
  GOSU: "غولد ستار",
  MATU: "ماتسون",
  MATS: "ماتسون",
  CMCU: "كرولي",
  CLAM: "كرولي",
  TRKU: "توركون",
  SKHU: "سينوكور",
  SKLU: "سينوكور",
  REGU: "RCL",
  SMLU: "سي بورد",
  SMDU: "ساموديرا",
};

const leases: Record<string, string> = {
  OTPU: "سي كيوب",
  FBIU: "فلورنز",
  TCLU: "تريتون",
  TRIU: "تريتون",
  SCSU: "سي كيوب",
  CAIU: "CAI",
  CAAU: "CAI",
  TEXU: "تكستينر",
  TGHU: "تكستينر",
  TGBU: "تكستينر",
  GESU: "سيكو",
  SEGU: "سيكو",
  BEAU: "بيكون",
  UETU: "يوروتيزر",
};

export function shippingLine(raw: string) {
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length < 4) return { name: "", lease: false };
  const prefix = code.slice(0, 4);
  if (lines[prefix]) return { name: lines[prefix], lease: false };
  if (leases[prefix]) return { name: leases[prefix], lease: true };
  return { name: "", lease: false };
}

export function lineLabel(raw: string) {
  const line = shippingLine(raw);
  if (!line.name) return "";
  return line.lease ? `${line.name} (تأجير)` : line.name;
}

const tracks: Record<string, (number: string) => string> = {
  "ميرسك": (number) => `https://www.maersk.com/tracking/${encodeURIComponent(number)}`,
  MSC: (number) => `https://www.msc.com/en/track-a-shipment?trackingNumber=${encodeURIComponent(number)}`,
  "CMA CGM": (number) => `https://www.cma-cgm.com/ebusiness/tracking/search?SearchBy=Container&Reference=${encodeURIComponent(number)}`,
  "كوسكو": (number) => `https://elines.coscoshipping.com/ebusiness/cargoTracking?trackingType=CONTAINER&number=${encodeURIComponent(number)}`,
  "هاباغ لويد": (number) => `https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html?container=${encodeURIComponent(number)}`,
  "ون لاين": (number) => `https://ecomm.one-line.com/one-ecom/manage-shipment/cargo-tracking?trakNoParam=${encodeURIComponent(number)}`,
  "إيفرغرين": (number) => `https://ct.shipmentlink.com/servlet/TDB1_CargoTracking.do`,
  HMM: (number) => `https://www.hmm21.com/cms/business/ebiz/trackTrace/trackTrace/index.jsp?type=1&number=${encodeURIComponent(number)}`,
  "يانغ مينغ": (number) => `https://www.yangming.com/e-service/track_trace/track_trace_cargo_tracking.aspx?rdolType=CT&num1=${encodeURIComponent(number)}`,
  "زيم": (number) => `https://www.zim.com/tools/track-a-shipment?consnumber=${encodeURIComponent(number)}`,
  OOCL: (number) => `https://www.oocl.com/eng/ourservices/eservices/cargotracking/Pages/cargotracking.aspx`,
  "وان هاي": (number) => `https://www.wanhai.com/views/cargo_track_v2/tracking_query.xhtml`,
  PIL: (number) => `https://www.pilship.com/digital-solutions/?tab=customer&id=track-trace&n=${encodeURIComponent(number)}`,
  KMTC: (number) => `https://www.ekmtc.com/`,
  SITC: (number) => `https://www.sitcline.com/`,
  "أركاس": (number) => `https://www.arkasline.com.tr/en/tracking`,
  "الإمارات": (number) => `https://www.emiratesline.com/`,
  "إكس برس": (number) => `https://www.x-pressfeeders.com/`,
  "تي إس لاين": (number) => `https://www.tslines.com/`,
  "غولد ستار": (number) => `https://www.goldstarline.com/`,
  "ماتسون": (number) => `https://www.matson.com/shipment-tracking.html`,
  "كرولي": (number) => `https://www.crowley.com/`,
  "توركون": (number) => `https://www.turkon.com/`,
  "سينوكور": (number) => `https://www.sinokor.co.kr/`,
  RCL: (number) => `https://www.rclgroup.com/`,
  "سي بورد": (number) => `https://www.seaboardmarine.com/`,
  "ساموديرا": (number) => `https://www.samudera.id/`,
};

export const shippingCompanies = Object.keys(tracks);

export function trackingUrlFor(name: string, raw: string) {
  const build = tracks[name.replace(" (تأجير)", "").trim()];
  if (!build) return "";
  return build(raw.replace(/\s/g, ""));
}

export function trackingUrl(raw: string) {
  const line = shippingLine(raw);
  if (!line.name || line.lease) return "";
  return trackingUrlFor(line.name, raw);
}
