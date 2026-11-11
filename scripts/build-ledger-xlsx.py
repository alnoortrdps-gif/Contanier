#!/usr/bin/env python3
"""دفتر الحاويات بنفس نظام التطبيق: عجل، سمك، والمتبقي محسوب."""

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.properties import CalcProperties

OUT = "/workspace/artifacts/الحاويات.xlsx"

NAVY = "0B1F33"
WHITE = "FFFFFF"
GREEN = "E5F6EA"
RED = "FDECEC"
AMBER = "FFF6E0"
ZEBRA = "F4F7FB"
LINE = "111111"
BLUE = "1D4E89"

thin = Border(
    left=Side(style="thin", color=LINE),
    right=Side(style="thin", color=LINE),
    top=Side(style="thin", color=LINE),
    bottom=Side(style="thin", color=LINE),
)
center = Alignment(horizontal="center", vertical="center", wrap_text=True)
right = Alignment(horizontal="right", vertical="center", wrap_text=True)

# دفعات بالترتيب: الأقدم أولاً. التاريخ إذا كان فارغاً بالجدول مكتوب كما هو.
MEAT = [
    ("87193", "مانيرفا / برازيل / ناتو", "رايد + دهن عجل", 112285, "USD",
     [(70000, "2026-01-08"), (27934, "2026-04-06"), (17666, "2026-04-13")],
     "MNBU9155774", "https://www.maersk.com/tracking", "2026-04-22", ""),
    ("7737", "دوجلوس - ناتو", "لسان عجل + تندرلوين + كيبرول + توب سايد + ستربليون", 205440, "USD",
     [(65000, "2026-12-31"), (140500, "2026-03-10")],
     "OOLU6256358", "https://www.oocl.com", "2026-03-30", ""),
    ("89977", "مانيرفا - دهن نور - أنجوس", "أنجوس - دهن + كيبرول - تندرلوين - توب سايد - ستربليون", 351580, "USD",
     [(63000, "2026-06-15"), (50000, "2026-06-17"), (50000, "2026-10-13"), (50580, "2026-10-28"),
      (5927.33, "2026-10-26"), (70000, "2026-10-31"), (62072.67, "2026-11-05")],
     "MSDU9702409", "https://www.msc.com", "2026-11-03", "تاريخ آخر دفعة غير مذكور بالجدول"),
    ("AR-19559", "مانيرفا ارجنتيني (كوتا من صالح)", "كيبرول (كوتا من صالح)", 127460, "USD",
     [(65000, "2026-07-20"), (62460, "2026-07-20")],
     "MCAU6018450", "https://www.maersk.com/tracking", "2026-09-17", ""),
    ("ALC263729", "لحم خاروف - استراليا", "لسان خاروف + أصناف أخرى - نور", 226033.84, "USD",
     [(120000, "2026-07-13"), (55000, "2026-10-14"), (51034, "2026-10-14")],
     "OTPU6453279", "https://www.msc.com", "2026-11-16", ""),
    ("AR/19878", "بلاك أرجنتيني مانيرفا", "بلاك أرجنتيني مانيرفا", 299582, "USD",
     [(150000, "2026-07-23")],
     "MCAU6073605", "https://www.maersk.com/tracking", "2026-12-10", ""),
    ("91321", "أنجوس منوع", "أنجوس منوع", 420000, "USD",
     [(130000, "2026-08-27")],
     "SUDU6248539", "https://www.maersk.com/tracking", "2026-12-19", ""),
    ("ALC264448", "لحم خاروف - استراليا", "لحم خاروف مقطع", 126378.29, "USD",
     [(63000, "2026-09-15"), (63378, "2026-09-30")],
     "MSDU3080545", "https://www.msc.com", "2026-11-16", ""),
    ("91357-1", "مانيرفا", "بريسكت", 169696.25, "USD",
     [(52000, "2026-08-19")],
     "241ISZ2634147", "https://www.msc.com", "2026-12-12", ""),
    ("91357-2", "مانيرفا", "بريسكت", 135658.9, "USD",
     [(52000, "2026-08-19")],
     "MNBU3273050", "https://www.maersk.com/tracking", "2026-11-16", ""),
    ("180626", "دوجلوس / ناتو", "نمره + 4 دهن", 178540.6, "USD",
     [(55000, "2026-09-01")],
     "OERU4099396", "https://www.oocl.com", "2026-11-30", ""),
    ("83776-1RS", "مانيرفا نور", "أنجوس منوع - كرتونة صينية", 214750.82, "USD",
     [(210000, "2026-09-17"), (4751, "2026-09-17")],
     "MEDUR3535800", "https://www.msc.com", "2026-12-06", ""),
    ("84583-8S", "مانيرفا نور", "أرقام صيني", 142197.25, "USD",
     [(140000, "2026-09-17"), (2766, "2026-09-17")],
     "MEDUR3535834", "https://www.msc.com", "2026-12-06", "المدفوع أكثر من الفاتورة"),
    ("83208-6S", "مانيرفا نور", "أرقام صيني", 142279.45, "USD",
     [(140000, "2026-09-17"), (2907, "2026-09-17")],
     "MEDUR3535768", "https://www.msc.com", "2026-12-06", "المدفوع أكثر من الفاتورة"),
    ("185626", "دوجلوس - نور ميتاني", "مقدم + دهن", 139655.78, "USD",
     [(42100, "2026-09-30")],
     "OERU4431242", "https://www.oocl.com", "2026-12-14", ""),
    ("92015", "مانيرفا - نور", "أنجوس منوع وفيليه أنجوس وكيبرول", 449200, "USD",
     [], "", "", "", ""),
    ("92017-1", "مانيرفا - نور", "أنجوس منوع وفيليه أنجوس وكيبرول", 307525, "USD",
     [], "", "", "", ""),
    ("92017-2", "مانيرفا - نور", "أنجوس منوع وفيليه أنجوس وكيبرول", 307525, "USD",
     [(93000, "2026-10-13")],
     "", "", "", ""),
    ("189026", "لسان عجل - دوجلوس 15 طن - ناتو", "لسان عجل - دوجلوس 15 طن - ناتو", 129519.29, "USD",
     [(40000, "2026-10-19")],
     "MNBU4093880", "https://www.maersk.com/tracking", "2026-12-12", ""),
    ("188926", "دهن عجل دوجلوس - 28 طن - ناتو", "دهن عجل - دوجلوس 28 طن - ناتو", 192973.02, "USD",
     [(60000, "2026-10-26")],
     "MNBU3970141", "https://www.maersk.com/tracking", "2026-12-12", ""),
]

FISH = [
    ("FTF0605-NAF02-26", "سمك فيليه رقم 3", "سمك فيليه حاوية 3", 49200, "USD",
     [(25000, "2026-10-03"), (24200, "2026-11-05")],
     "EMCU5694025", "https://www.shipmentlink.com/", "2026-11-11", "تاريخ الدفعة الثانية غير مذكور بالجدول"),
    ("026/096", "سمك أرجنتيني حاوية 6", "سمك أرجنتيني 026/096", 67200, "USD",
     [(35000, "2026-09-03"), (32200, "2026-11-08")],
     "MNBU9064231", "https://www.maersk.com/tracking", "2026-11-19", "تاريخ الدفعة الثانية غير مذكور بالجدول"),
    ("PI NAF03", "سمك فيليه 4", "ستيك سمك + سمك فيليه", 48560, "USD",
     [(30000, "2026-08-24")],
     "", "", "", "التحميل بداية شهر 11"),
    ("7", "سمك إسباني 1- نور + علاء عفانه", "حاوية 1", 269432.5, "EUR",
     [(70000, "2026-10-06"), (50000, "2026-10-14"), (70000, "2026-10-14"), (79432.5, "2026-10-28")],
     "SUDU6171226", "https://www.maersk.com/tracking", "2026-10-31", "المبلغ يشمل فواتير 7 و 8 و 13 و 14"),
    ("8", "سمك إسباني 2+ علاء عفانه", "حاوية 2", 0, "EUR",
     [], "MNBU9146710", "https://www.maersk.com/tracking", "2026-10-31", "المبلغ والدفعات على فاتورة 7"),
    ("13", "سمك إسباني 3+ علاء عفانه", "حاوية 3", 0, "EUR",
     [], "SUDU6103772", "https://www.maersk.com/tracking", "2026-10-31", "المبلغ والدفعات على فاتورة 7"),
    ("14", "سمك إسباني 4+ علاء عفانه", "حاوية 4", 0, "EUR",
     [], "MNBU9014288", "https://www.maersk.com/tracking", "2026-10-31", "المبلغ والدفعات على فاتورة 7"),
    ("PROFORMA 60851", "سمك سلمينو حاوية ثانية", "سمك سلمينو حاوية ثانية", 76950, "USD",
     [(25000, "2026-09-28")],
     "OERU4436178", "https://www.oocl.com", "2026-11-30", ""),
    ("026/105", "سمك أرجنتيني حاوية 7", "سمك أرجنتيني 026/105", 71400, "USD",
     [(35000, "2026-09-28")],
     "", "", "", ""),
    ("026/101", "سمك أرجنتيني حاوية 8", "سمك أرجنتيني 026/101", 68850, "USD",
     [(30000, "2026-10-14")],
     "SUDU6178365", "https://www.maersk.com/tracking", "2026-12-10", ""),
    ("9108", "سمك مسكوزا", "سمك مسكوزا", 76680, "USD",
     [(40000, "2026-10-04")],
     "MNBU3358687", "https://www.maersk.com/tracking", "2026-11-28", ""),
    ("26/120", "سمك أرجنتيني حاوية 9", "دينيس سمك أرجنتيني", 36400, "USD",
     [(18200, "2026-11-08")],
     "", "", "", "لا تفاصيل إلى الآن. تاريخ الدفعة غير مذكور بالجدول"),
]

ARCHIVE = [
    ("89401-2", "مانيرفا - برازيلي - انجوس حاوية 2", "أنجوس منوع", 314757.55, "USD",
     [(60000, "2026-06-08"), (50000, "2026-06-14"), (45000, "2026-06-18"), (60000, "2026-10-19"), (99758, "2026-10-22")],
     "MNBU0530513", "https://www.maersk.com/tracking", "2026-10-31", "وصلت ومدفوعة"),
    ("90611", "لسان - بريسكيت - مانيرفا", "لسان عجل - بريسكيت", 153690, "USD",
     [(85000, "2026-07-14"), (68690, "2026-09-28")],
     "MNBU0674444", "https://www.maersk.com/tracking", "2026-10-08", "أرشيف. وصلت الشركة"),
    ("174926", "دوجلوس / ناتو", "أرقام", 91007, "USD",
     [(35000, "2026-08-11"), (56007, "2026-10-11")],
     "FBIU5940270", "https://www.maersk.com/tracking", "2026-10-28", ""),
    ("180526", "دوجلوس / نور", "نمره + 4 دهن", 178615.93, "USD",
     [(55000, "2026-09-02"), (80924.97, "2026-09-30"), (42691, "2026-10-08")],
     "MMAU1478750", "https://www.maersk.com/tracking", "2026-10-27", ""),
    ("ALC264447", "مانيرفا استراليا", "لحم خاروف مقطع", 128501, "USD",
     [(63000, "2026-09-15"), (65501, "2026-10-14")],
     "MSDU3006234", "https://www.msc.com", "2026-10-29", ""),
    ("60643", "سمك سلمينو", "سمك سلمينو", 75600, "USD",
     [(25200, "2026-10-03"), (50435, "2026-10-03")],
     "HLBU9388709", "https://www.hapag-lloyd.com", "2026-10-04", "سمك. وصلت ومدفوعة"),
]

PAYS = 8
# A رقم، B مورد، C صنف، D عملة، E مبلغ، ثم 8 دفعات (مبلغ+تاريخ) = 16، ثم محسوب
# أعمدة المبلغ: 6,8,10,12,14,16,18,20
AMOUNT_COLS = [6, 8, 10, 12, 14, 16, 18, 20]
PAID_COL = 22
LEFT_COL = 23
BOX_COL = 24
LINK_COL = 25
ETA_COL = 26
DAYS_COL = 27
STATE_COL = 28
NOTE_COL = 29


def headers():
    row = ["رقم الفاتورة", "المورد", "الصنف", "العملة", "مبلغ الفاتورة"]
    for i in range(1, PAYS + 1):
        row += [f"دفعة {i}", f"تاريخ {i}"]
    row += ["المدفوع", "المتبقي", "رقم الحاوية", "رابط التتبع", "موعد الوصول", "الأيام", "الحالة", "ملاحظة"]
    return row


def write_sheet(ws, rows, empty=8):
    ws.sheet_view.rightToLeft = True
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(NOTE_COL)}1"
    ws.row_dimensions[1].height = 28
    head_fill = PatternFill("solid", fgColor=NAVY)
    head_font = Font(name="Calibri", bold=True, color=WHITE, size=12)
    for col, title in enumerate(headers(), 1):
        cell = ws.cell(1, col, title)
        cell.fill = head_fill
        cell.font = head_font
        cell.alignment = center
        cell.border = thin
    all_rows = list(rows) + [None] * empty
    for index, item in enumerate(all_rows):
        r = index + 2
        ws.row_dimensions[r].height = 22
        zebra = PatternFill("solid", fgColor=ZEBRA if index % 2 == 0 else WHITE)
        if item:
            number, supplier, product, amount, currency, pays, box, link, eta, note = item
            values = {
                1: number, 2: supplier, 3: product, 4: currency, 5: amount,
                BOX_COL: box, LINK_COL: link, ETA_COL: eta or None, NOTE_COL: note,
            }
            for i, (value, date) in enumerate(pays[:PAYS]):
                values[AMOUNT_COLS[i]] = value
                values[AMOUNT_COLS[i] + 1] = date
        else:
            values = {}
        for col in range(1, NOTE_COL + 1):
            cell = ws.cell(r, col, values.get(col, None))
            cell.border = thin
            cell.fill = zebra
            cell.font = Font(name="Calibri", size=12, color="111111")
            cell.alignment = center if col not in (2, 3, NOTE_COL) else right
        pay_sum = "+".join(f"{get_column_letter(c)}{r}" for c in AMOUNT_COLS)
        paid = ws.cell(r, PAID_COL, f"=SUM({pay_sum})")
        left = ws.cell(r, LEFT_COL, f'=IF(E{r}="", "", E{r}-V{r})')
        days = ws.cell(r, DAYS_COL, f'=IF(Z{r}="","",IF(Z{r}<TODAY(),"وصلت",Z{r}-TODAY()))')
        state = ws.cell(r, STATE_COL, f'=IF(E{r}="","",IF(W{r}<5,"تم الدفع","باقي"))')
        for cell in (paid, left, days, state):
            cell.border = thin
            cell.alignment = center
            cell.font = Font(name="Calibri", size=12, bold=True)
        for col in (5, PAID_COL, LEFT_COL, *AMOUNT_COLS):
            ws.cell(r, col).number_format = '#,##0.00'
        for col in (7, 9, 11, 13, 15, 17, 19, 21, ETA_COL):
            if ws.cell(r, col).value:
                ws.cell(r, col).number_format = "DD-MM-YYYY"
        if link := values.get(LINK_COL):
            ws.cell(r, LINK_COL).hyperlink = link
            ws.cell(r, LINK_COL).font = Font(name="Calibri", size=11, color=BLUE, underline="single")
    last = 1 + len(all_rows)
    total_row = last + 1
    ws.row_dimensions[total_row].height = 24
    label = ws.cell(total_row, 1, "المجموع")
    label.font = Font(name="Calibri", bold=True, size=13, color=WHITE)
    label.fill = PatternFill("solid", fgColor=NAVY)
    label.alignment = center
    for col in range(2, NOTE_COL + 1):
        cell = ws.cell(total_row, col, None)
        cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.font = Font(name="Calibri", bold=True, size=12, color=WHITE)
        cell.border = thin
        cell.alignment = center
    ws.cell(total_row, 5, f"=SUM(E2:E{last})")
    ws.cell(total_row, PAID_COL, f"=SUM(V2:V{last})")
    ws.cell(total_row, LEFT_COL, f"=SUM(W2:W{last})")
    for col in (5, PAID_COL, LEFT_COL):
        ws.cell(total_row, col).number_format = '#,##0.00'
        ws.cell(total_row, col).font = Font(name="Calibri", bold=True, size=12, color=WHITE)
        ws.cell(total_row, col).fill = PatternFill("solid", fgColor=NAVY)
    ws.conditional_formatting.add(
        f"W2:W{last}",
        CellIsRule(operator="greaterThan", formula=["5"], fill=PatternFill("solid", fgColor="F8D0D0"),
                   font=Font(name="Calibri", bold=True, color="9B1C1C", size=12)),
    )
    ws.conditional_formatting.add(
        f"W2:W{last}",
        CellIsRule(operator="lessThan", formula=["5"], fill=PatternFill("solid", fgColor="CDEFD8"),
                   font=Font(name="Calibri", bold=True, color="146C36", size=12)),
    )
    ws.conditional_formatting.add(
        f"AB2:AB{last}",
        FormulaRule(formula=[f'AB2="تم الدفع"'], fill=PatternFill("solid", fgColor="CDEFD8"),
                    font=Font(name="Calibri", bold=True, color="146C36", size=12)),
    )
    ws.conditional_formatting.add(
        f"AB2:AB{last}",
        FormulaRule(formula=[f'AB2="باقي"'], fill=PatternFill("solid", fgColor="F8D0D0"),
                    font=Font(name="Calibri", bold=True, color="9B1C1C", size=12)),
    )
    widths = {
        1: 20, 2: 32, 3: 42, 4: 10, 5: 16,
        PAID_COL: 16, LEFT_COL: 16, BOX_COL: 18, LINK_COL: 28, ETA_COL: 16,
        DAYS_COL: 12, STATE_COL: 14, NOTE_COL: 36,
    }
    for col in AMOUNT_COLS:
        widths[col] = 14
        widths[col + 1] = 14
    for col, width in widths.items():
        ws.column_dimensions[get_column_letter(col)].width = width
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.oddHeader.right.text = "الحاويات"
    ws.print_title_rows = "1:1"
    ws.page_setup.horizontalCentered = True
    ws.sheet_view.zoomScale = 110
    return last


def by_eta(row):
    eta = row[8] or ""
    return (eta == "", eta)


def main():
    MEAT.sort(key=by_eta)
    FISH.sort(key=by_eta)
    ARCHIVE.sort(key=by_eta)
    wb = Workbook()
    wb.calculation.calcMode = "auto"
    wb.calculation.fullCalcOnLoad = True
    home = wb.active
    home.title = "الرئيسية"
    home.sheet_view.rightToLeft = True
    home.sheet_view.showGridLines = False
    home.sheet_view.zoomScale = 130
    home.sheet_properties.tabColor = NAVY
    home.column_dimensions["A"].width = 28
    home.column_dimensions["B"].width = 28
    home.column_dimensions["C"].width = 70
    home.row_dimensions[1].height = 42
    title = home["A1"]
    title.value = "الحاويات"
    title.font = Font(name="Calibri", size=28, bold=True, color=WHITE)
    title.fill = PatternFill("solid", fgColor=NAVY)
    title.alignment = center
    home.merge_cells("A1:B1")
    home["B1"].fill = PatternFill("solid", fgColor=NAVY)
    cards = [
        (3, "المتبقي عجل", '=SUMIF(العجل!W:W,">5")', '#,##0.00'),
        (4, "المتبقي سمك", '=SUMIF(السمك!W:W,">5")', '#,##0.00'),
        (5, "أقرب عجل لسا عليه باقي", '=IF(COUNTIFS(العجل!W:W,">5",العجل!Z:Z,">="&TODAY())=0,"ما في",MINIFS(العجل!Z:Z,العجل!W:W,">5",العجل!Z:Z,">="&TODAY()))', "DD-MM-YYYY"),
        (6, "أقرب سمك لسا عليه باقي", '=IF(COUNTIFS(السمك!W:W,">5",السمك!Z:Z,">="&TODAY())=0,"ما في",MINIFS(السمك!Z:Z,السمك!W:W,">5",السمك!Z:Z,">="&TODAY()))', "DD-MM-YYYY"),
    ]
    for row, label, formula, fmt in cards:
        home.row_dimensions[row].height = 36
        name = home.cell(row, 1, label)
        name.font = Font(name="Calibri", size=16, bold=True, color=NAVY)
        name.alignment = Alignment(horizontal="right", vertical="center")
        name.fill = PatternFill("solid", fgColor="E8EEF5")
        name.border = thin
        value = home.cell(row, 2, formula)
        value.font = Font(name="Calibri", size=18, bold=True, color="9B1C1C")
        value.alignment = center
        value.number_format = fmt
        value.border = thin
        value.fill = PatternFill("solid", fgColor="F8D0D0")
    notes = [
        (8, "الشغل من صفحتين: العجل، والسمك. الأرشيف للي وصلت الشركة وخلصت."),
        (9, "لا تكتب في المدفوع ولا المتبقي ولا الأيام ولا الحالة. بينحسبوا لحالهم."),
        (10, "دفعة جديدة: اكتب المبلغ في أول خانة دفعة فاضية، واكتب التاريخ جنبها."),
        (11, "فاتورة جديدة: أول صف فاضي. غيّر موعد الوصول إذا تحدّث."),
        (12, "أحمر يعني باقي. أخضر يعني تم الدفع. أقل من 5 دولار يعتبر تم الدفع."),
        (13, "الملف يفتح على الكمبيوتر وعلى التلفون، ومن غير اشتراك."),
    ]
    for row, text in notes:
        cell = home.cell(row, 1, text)
        home.merge_cells(start_row=row, start_column=1, end_row=row, end_column=3)
        cell.font = Font(name="Calibri", size=15, color=NAVY)
        cell.alignment = Alignment(horizontal="right", vertical="center")
        home.row_dimensions[row].height = 28

    meat = wb.create_sheet("العجل")
    fish = wb.create_sheet("السمك")
    archive = wb.create_sheet("الأرشيف")
    meat.sheet_properties.tabColor = "8C2F2F"
    fish.sheet_properties.tabColor = "1D4E89"
    archive.sheet_properties.tabColor = "6B7280"
    write_sheet(meat, MEAT)
    write_sheet(fish, FISH)
    write_sheet(archive, ARCHIVE, empty=3)
    wb.active = home
    wb.save(OUT)
    print(OUT)


if __name__ == "__main__":
    main()
