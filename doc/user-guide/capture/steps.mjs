import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// Shot list, in the order the data depends on. Each step logs in as the demo user who would really do it.
const bottom = (p) => p.evaluate(() => document.querySelectorAll('*').forEach((e) => { if (e.scrollHeight > e.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(e).overflowY)) e.scrollTop = e.scrollHeight }))
// The control that follows a <label> with this exact text (labels carry no for= in this UI).
const lab = (p, text) => p.locator(`xpath=//label[normalize-space()="${text}"]/following::*[self::input or self::select or self::textarea][1]`)
const id = (p) => Number(new URL(p.url()).pathname.split('/').pop())

async function ch01(sh) {
  await sh.step('01 login', async () => {
    const c = await sh.browser.newContext({ baseURL: sh.base, viewport: { width: 1280, height: 800 }, locale: 'vi-VN' })
    const p = await c.newPage(); await sh.go(p, '/login')
    await p.fill('#login', 'trung.bx'); await p.fill('#password', 'Demo@2026')
    await sh.shot(p, '01-bat-dau/01-dang-nhap', { hl: ['#login-form button'] })
    await c.close()
    const m = await sh.browser.newContext({ baseURL: sh.base, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' })
    const q = await m.newPage(); await sh.go(q, '/login')
    await q.fill('#login', 'trung.bx'); await q.fill('#password', 'Demo@2026')
    await sh.shot(q, '01-bat-dau/02-dang-nhap-phone'); await m.close()
  })
  await sh.step('01 dashboard', async () => {
    const p = await sh.page('trung.bx', '/'); await sh.shot(p, '01-bat-dau/03-tong-quan'); await p.close()
  })
}


async function ch01b(sh) {
  await sh.step('01 menu', async () => {
    const p = await sh.page('toan.pa', '/crm')
    for (const t of ['Đơn bán', 'Kế toán']) { const g = p.locator('aside, nav').getByText(t, { exact: true }).first(); if (await g.count()) await g.click().catch(() => {}) }
    await sh.shot(p, '01-bat-dau/04-menu')
    const item = p.locator('nav a', { hasText: 'Danh sách cơ hội' }).first()
    await item.hover()
    await sh.shot(p, '01-bat-dau/05-ghim-hover', { hl: [item] })
    await item.locator('xpath=..').locator('button').first().click().catch(async () => { await p.getByRole('button', { name: 'Ghim lên đầu' }).first().click() })
    await sh.shot(p, '01-bat-dau/05-ghim')
    await p.locator('nav a', { hasText: 'Danh sách cơ hội' }).nth(1).hover(); await p.locator('nav a', { hasText: 'Danh sách cơ hội' }).nth(1).locator('xpath=..').locator('button').first().click().catch(() => {}) // unpin again
    await p.close()
  })
  await sh.step('01 menu phone', async () => {
    const p = await sh.page('trung.bx', '/', { phone: true })
    await p.locator('header button.btn-icon').first().click(); await sh.shot(p, '01-bat-dau/06-menu-phone'); await p.close()
  })
  await sh.step('01 general', async () => {
    const p = await sh.page('trung.bx', '/settings/general'); await sh.shot(p, '01-bat-dau/07-cai-dat-chung'); await p.close()
  })
  await sh.step('01 chatter', async () => {
    const p = await sh.page('toan.pa', '/sales'); await p.getByRole('button', { name: 'Đã xác nhận', exact: true }).click(); await sh.settle(p)
    await p.locator('tbody tr').first().click(); await sh.settle(p)
    await bottom(p)
    await sh.shot(p, '01-bat-dau/08-nhat-ky'); await p.close()
  })
}


async function ch02(sh, S) {
  await sh.step('02 contacts', async () => {
    const p = await sh.page('trung.bx', '/contacts'); await sh.shot(p, '02-danh-ba-san-pham/01-danh-ba', { hl: ['input[type=search], input[placeholder="Tìm kiếm…"]'] })
    await p.close()
  })
  await sh.step('02 contact with leads', async () => {
    const p = await sh.page('trung.bx', '/')
    const r = await (await p.request.get('/api/crm/leads?size=100')).json()
    const pid = r.items.find((l) => l.partner_id && !l.lost)?.partner_id
    if (!pid) throw new Error('no lead with a customer')
    await sh.go(p, `/contacts/${pid}`)
    await sh.shot(p, '02-danh-ba-san-pham/02-lien-he', { hl: [p.getByRole('link', { name: /Cơ hội \(/ })] }); await p.close()
  })
  await sh.step('02 new customer', async () => {
    const p = await sh.page('trung.bx', '/contacts/new')
    await p.fill('input[name=name]', 'Công ty TNHH Giải pháp Số An Khang')
    for (const l of ['Là công ty', 'Khách hàng']) await p.locator('label', { hasText: l }).locator('input[type=checkbox]').first().check().catch(() => {})
    for (const [l, v] of [['Email', 'mua.hang@ankhang.example'], ['Điện thoại', '0287 300 1234'], ['Mã số thuế', '0108765432'], ['Địa chỉ', '25 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh']]) await lab(p, l).fill(v).catch(() => {})
    await sh.shot(p, '02-danh-ba-san-pham/03-them-khach', { hl: [p.getByRole('button', { name: 'Lưu', exact: true })] })
    await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await sh.settle(p, 800)
    await p.close()
  })
  await sh.step('02 products', async () => {
    const p = await sh.page('thuy.dd', '/products'); await sh.shot(p, '02-danh-ba-san-pham/04-san-pham'); await p.close()
  })
  await sh.step('02 new product', async () => {
    const p = await sh.page('thuy.dd', '/products/new')
    await p.fill('input[name=code]', 'DV99'); await p.fill('input[name=name]', 'Khảo sát hạ tầng mạng tại chỗ')
    await lab(p, 'Loại').selectOption({ label: 'Dịch vụ' }); await lab(p, 'Đơn vị tính').fill('lần'); await p.fill('input[name=sale_price]', '1500000')
    await lab(p, 'Thuế GTGT').selectOption({ label: '10%' }).catch(() => {})
    await sh.shot(p, '02-danh-ba-san-pham/05-san-pham-moi', { hl: [p.getByRole('button', { name: 'Lưu', exact: true })] })
    await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await sh.settle(p, 800)
    await p.close()
  })
}


const D = '03-crm'
async function ch03(sh, S) {
  await sh.step('03 board', async () => {
    let p = await sh.page('trung.bx', '/crm'); await p.waitForSelector('section'); await sh.shot(p, `${D}/01-bang-co-hoi`); await p.close()
    p = await sh.page('toan.pa', '/crm'); await p.waitForSelector('section'); await p.locator('input.check').first().uncheck(); await sh.settle(p, 600)
    await sh.shot(p, `${D}/02-bang-co-hoi-quan-ly`, { hl: ['input.check', 'section[aria-label="Mới"] [role=group]'] }); await p.close()
  })
  await sh.step('03 quick add', async () => {
    const p = await sh.page('trung.bx', '/crm'); await p.waitForSelector('section')
    await sh.shot(p, `${D}/03a-nut-them-nhanh`, { hl: ['section[aria-label="Mới"] button[aria-label="Thêm nhanh cơ hội"]'] })
    await p.locator('section[aria-label="Mới"] button[aria-label="Thêm nhanh cơ hội"]').click()
    const f = p.locator('form.card').first()
    await f.locator('input').first().fill('Trang bị phòng máy 30 PC - Trường THCS Minh Khai')
    await f.locator('input[placeholder="Tên người liên hệ"]').fill('Cô Lan')
    await f.locator('input[type=number]').fill('450000000')
    await f.locator('button[aria-label*="2"]').first().click().catch(() => {})
    await sh.shot(p, `${D}/03-them-nhanh`, { hl: [f.locator('button.btn-primary')] })
    await f.locator('button.btn-primary').click(); await sh.settle(p, 600)
    await p.getByText('Trang bị phòng máy 30 PC').first().click(); await p.waitForURL(/crm\/leads\/\d+/); S.lead = id(p)
    await p.close()
  })
  await sh.step('03 lead', async () => {
    const p = await sh.page('trung.bx', `/crm/leads/${S.lead}`)
    await p.fill('#l-phone', '0912 345 678'); await p.fill('#l-email', 'lan.minhkhai@example.edu.vn'); await p.fill('#l-prob', '30'); await p.fill('#l-close', '2026-12-15'); await p.fill('#l-source', 'Website')
    await sh.shot(p, `${D}/04-co-hoi`, { hl: [p.getByRole('button', { name: 'Lưu', exact: true })] })
    await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await sh.settle(p, 600)
    await p.close()
  })
  await sh.step('03 activity', async () => {
    const p = await sh.page('trung.bx', `/crm/leads/${S.lead}`)
    await p.locator('#act-form select').selectOption({ label: 'Gọi điện' })
    await p.fill('input[name=act_summary]', 'Gọi tư vấn cấu hình phòng máy')
    await bottom(p); await sh.shot(p, `${D}/05a-nhap-lich`, { hl: ['#act-form'] })
    await p.locator('#act-form button.btn-primary').click(); await sh.settle(p, 600)
    await sh.shot(p, `${D}/05-them-lich`, { hl: ['#act-title'] })
    await p.getByRole('button', { name: 'Hoàn thành', exact: true }).first().click()
    await p.fill('#done-fb', 'Khách cần 30 máy, ngân sách 450 triệu, hẹn xem báo giá.')
    await sh.shot(p, `${D}/06-hoan-thanh-lich`)
    await p.getByRole('button', { name: 'Xong & lên lịch tiếp' }).click(); await sh.settle(p, 600)
    await p.close()
  })
  await sh.step('03 quote', async () => {
    const p = await sh.page('trung.bx', `/crm/leads/${S.lead}`)
    await p.getByRole('button', { name: 'Tạo báo giá', exact: true }).click(); await p.waitForSelector('dialog[open]')
    await sh.shot(p, `${D}/07-modal-bao-gia`, { hl: ['dialog[open] input[value=new]'] })
    await p.locator('dialog[open] button.btn-primary').click(); await p.waitForURL(/\/sales\/\d+/); await sh.settle(p, 600)
    S.quote = id(p)
    await sh.shot(p, `${D}/08-bao-gia-tu-co-hoi`, { hl: ['a[href^="/crm/leads/"]'] })
    await p.close()
  })
  await sh.step('03 lost', async () => {
    const p = await sh.page('trung.bx', '/')
    S.lost = (await (await p.request.get('/api/crm/leads?size=100')).json()).items.find((l) => !l.lost && !l.stage_won && l.id !== S.lead).id
    await sh.go(p, `/crm/leads/${S.lost}`)
    await p.getByRole('button', { name: 'Đánh dấu thất bại' }).click(); await p.waitForSelector('dialog[open]')
    await p.selectOption('#lost-id', { label: 'Chọn đối thủ' }); await p.fill('#lost-reason', 'Khách chọn nhà cung cấp có giá thấp hơn 5%.')
    await sh.shot(p, `${D}/09-modal-that-bai`)
    await p.locator('dialog[open] button.btn-danger').click(); await sh.settle(p, 700)
    await sh.shot(p, `${D}/10-co-hoi-thua`, { hl: [p.getByRole('button', { name: 'Mở lại' })] })
    await p.getByRole('button', { name: 'Mở lại' }).click(); await sh.settle(p, 500) // leave the demo data as it was
    await p.close()
  })
  await sh.step('03 manager views', async () => {
    let p = await sh.page('toan.pa', '/crm/leads'); await sh.shot(p, `${D}/11-danh-sach`); await p.close()
    p = await sh.page('toan.pa', '/crm/activities'); await sh.shot(p, `${D}/12-lich-cham-soc`); await p.close()
    p = await sh.page('toan.pa', '/crm/reports')
    await p.locator('select').first().selectOption({ label: 'Nhân viên' }).catch(() => {}); await sh.shot(p, `${D}/13-phan-tich`); await p.close()
    p = await sh.page('toan.pa', '/settings/crm'); await sh.shot(p, `${D}/14-cau-hinh`); await p.close()
    p = await sh.page('trung.bx', '/crm', { phone: true }); await p.waitForSelector('section'); await sh.shot(p, `${D}/15-bang-phone`); await p.close()
  })
}


const B = '04-ban-hang', K = '05-kho'
const save = async (sh, p) => { await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await sh.settle(p, 800) }
async function ch04(sh, S) {
  await sh.step('04 list', async () => {
    const p = await sh.page('toan.pa', '/sales'); await sh.shot(p, `${B}/01-danh-sach`); await p.close()
  })
  await sh.step('04 new quote', async () => {
    const p = await sh.page('trung.bx', '/sales/new')
    await sh.pick(p, 'partner', 'An Khang'); await p.fill('input[name=due_days]', '30')
    await sh.btn(p, 'Thêm dòng'); await sh.pick(p, 'line0_product', 'CPU007'); await p.fill('input[name=line0_qty]', '3'); await p.fill('input[name=line0_discount]', '5')
    await sh.btn(p, 'Thêm dòng'); await sh.pick(p, 'line1_product', 'DV01'); await p.fill('input[name=line1_qty]', '3')
    await sh.shot(p, `${B}/02-bao-gia-moi`, { hl: [p.getByRole('button', { name: 'Thêm dòng' })] })
    await save(sh, p); await p.waitForURL(/\/sales\/\d+/); S.order = id(p)
    await sh.shot(p, `${B}/03-bao-gia-da-luu`); await p.close()
  })
  await sh.step('04 link lead', async () => {
    const p = await sh.page('toan.pa', `/sales/${S.quote}`)
    await sh.btn(p, 'Thêm dòng'); await sh.pick(p, 'line0_product', 'CPU007'); await p.fill('input[name=line0_qty]', '30'); await save(sh, p)
    await sh.shot(p, `${B}/04-lien-ket-co-hoi`, { hl: ['#o-lead'] }); await p.close()
  })
  await sh.step('04 confirm', async () => {
    const p = await sh.page('toan.pa', `/sales/${S.order}`)
    await sh.shot(p, `${B}/05-xac-nhan`, { hl: [p.getByRole('button', { name: 'Xác nhận đơn' })] })
    await p.getByRole('button', { name: 'Xác nhận đơn' }).click(); await sh.settle(p, 800)
    S.delivery = Number((await p.locator('a[href^="/pickings/"]').first().getAttribute('href')).split('/').pop())
    await sh.shot(p, `${B}/06-da-xac-nhan`, { hl: ['a[href^="/pickings/"]'] }); await p.close()
  })
}
async function ch05(sh, S) {
  await sh.step('05 stock', async () => {
    const p = await sh.page('thang.pd', '/stock'); await sh.shot(p, `${K}/01-ton-kho`)
    await p.locator('input[placeholder="Tìm kiếm…"]').fill('CPU007'); await sh.settle(p, 700)
    await p.locator('tbody tr').first().click(); await sh.shot(p, `${K}/02-ton-theo-kho`); await p.close()
  })
  await sh.step('05 pickings', async () => {
    const p = await sh.page('thang.pd', '/pickings'); await p.locator('label', { hasText: 'Chờ xử lý' }).locator('input').check(); await sh.settle(p)
    await sh.shot(p, `${K}/03-phieu-kho`, { hl: [p.locator('label', { hasText: 'Chờ xử lý' })] }); await p.close()
  })
  await sh.step('05 delivery', async () => {
    const p = await sh.page('dung.dd', `/pickings/${S.delivery}`); await sh.shot(p, `${K}/04-phieu-xuat`)
    await p.fill('input[name=line0_qty]', '2'); await sh.shot(p, `${K}/05-giao-mot-phan`, { hl: ['input[name=line0_qty]'] })
    await save(sh, p); await p.close()
  })
  await sh.step('05 validate delivery', async () => {
    const p = await sh.page('thang.pd', `/pickings/${S.delivery}`)
    await sh.shot(p, `${K}/06a-nut-xac-nhan`, { hl: [p.getByRole('button', { name: 'Xác nhận', exact: true })] })
    await p.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await sh.settle(p, 900)
    await sh.shot(p, `${K}/06-xac-nhan-xuat`, { hl: ['a[href^="/moves/"]'] })
    S.move = await p.locator('a[href^="/moves/"]').first().getAttribute('href'); await p.close()
  })
  await sh.step('05 delivery move', async () => {
    const p = await sh.page('my.tp', S.move); await sh.shot(p, `${K}/07-but-toan-xuat`); await p.close()
  })
  await sh.step('05 backorder', async () => {
    const p = await sh.page('thang.pd', '/pickings'); await p.locator('label', { hasText: 'Chờ xử lý' }).locator('input').check()
    await p.locator('input[placeholder="Tìm kiếm…"]').fill('An Khang'); await sh.settle(p, 700)
    await sh.shot(p, `${K}/08-backorder`); await p.close()
  })
}
async function ch04b(sh, S) {
  await sh.step('04 invoice', async () => {
    const p = await sh.page('toan.pa', `/sales/${S.order}`)
    await sh.shot(p, `${B}/07a-don-giao-mot-phan`, { hl: [p.getByRole('button', { name: 'Tạo hoá đơn' })] })
    await p.getByRole('button', { name: 'Tạo hoá đơn' }).click(); await p.waitForURL(/\/invoices\/\d+/); await sh.settle(p, 600)
    S.inv = id(p); await sh.shot(p, `${B}/07-tao-hoa-don`); await p.close()
  })
  await sh.step('04 phone', async () => {
    const p = await sh.page('trung.bx', `/sales/${S.order}`, { phone: true }); await sh.shot(p, `${B}/08-don-phone`); await p.close()
  })
}
async function ch05b(sh, S) {
  await sh.step('05 receipt', async () => {
    const p = await sh.page('thuy.dd', '/pickings/new?type=in')
    await sh.pick(p, 'partner', 'Thiên Phú'); await sh.pick(p, 'line0_product', 'CPU007')
    await p.fill('input[name=line0_qty]', '10'); await p.fill('input[name=line0_cost]', '2600000')
    await sh.shot(p, `${K}/09-phieu-nhap-moi`); await save(sh, p); await p.waitForURL(/\/pickings\/\d+/); S.receipt = id(p); await p.close()
  })
  await sh.step('05 validate receipt', async () => {
    const p = await sh.page('thang.pd', `/pickings/${S.receipt}`)
    await p.getByRole('button', { name: 'Xác nhận', exact: true }).click(); await sh.settle(p, 900); await sh.shot(p, `${K}/10-xac-nhan-nhap`); await p.close()
  })
}

const A = '06-ke-toan'
const lines = (p, i) => p.locator(`select[name=line${i}_account]`)
const selStart = (loc, prefix) => loc.evaluate((e, pre) => { const o = [...e.options].find((x) => x.text.startsWith(pre)); e.value = o.value; e.dispatchEvent(new Event('change', { bubbles: true })) }, prefix)
async function ch06(sh, S) {
  await sh.step('06 list', async () => {
    const p = await sh.page('van.dn', '/invoices'); await sh.shot(p, `${A}/01-hoa-don`); await p.close()
  })
  await sh.step('06 draft + post', async () => {
    const p = await sh.page('van.dn', `/invoices/${S.inv}`)
    await sh.shot(p, `${A}/02-hoa-don-nhap`, { hl: [p.getByRole('button', { name: 'Ghi sổ' })] })
    await p.getByRole('button', { name: 'Ghi sổ' }).click(); await sh.settle(p, 900)
    await sh.shot(p, `${A}/03-da-ghi-so`, { hl: [p.getByRole('button', { name: 'Phát hành HĐĐT' })] })
    await p.getByRole('button', { name: 'Phát hành HĐĐT' }).click(); await sh.settle(p, 1200)
    await sh.shot(p, `${A}/04-hddt`);
    await p.getByRole('button', { name: 'Tuỳ chọn in' }).click(); await sh.shot(p, `${A}/05-menu-in`, { hl: [p.getByRole('menuitem', { name: 'Tải PDF' })] })
    await p.close()
  })
  await sh.step('06 receipt', async () => {
    const p = await sh.page('quynh.nb', `/invoices/${S.inv}`)
    await p.locator('a.btn', { hasText: 'Thu tiền' }).click(); await p.waitForURL(/payments\/new/); await sh.settle(p)
    await sh.shot(p, `${A}/06-thu-tien-moi`, { hl: [p.getByRole('button', { name: 'Lưu & duyệt' })] })
    await p.getByRole('button', { name: 'Lưu & duyệt' }).click(); await p.waitForURL(/payments\/\d+/); await sh.settle(p, 900); S.pay = id(p)
    await sh.shot(p, `${A}/07-phieu-thu-da-duyet`)
    await sh.go(p, `/invoices/${S.inv}`); await sh.shot(p, `${A}/08-hoa-don-da-thu`)
    await sh.go(p, '/payments'); await sh.shot(p, `${A}/09-thu-tien`); await p.close()
  })
  await sh.step('06 manual entry', async () => {
    const p = await sh.page('yen.pd', '/moves/new')
    await p.fill('input[name=ref]', 'Thuế GTGT đầu vào HĐ 0001234 - Thiên Phú')
    await selStart(lines(p, 0), '1331'); await p.fill('input[name=line0_debit]', '2600000')
    await sh.pick(p, 'line0_partner', 'Thiên Phú').catch(() => {})
    await selStart(lines(p, 1), '331'); await p.fill('input[name=line1_credit]', '2600000')
    await sh.shot(p, `${A}/10-but-toan-moi`, { hl: [p.getByRole('button', { name: 'Lưu nháp' })] })
    await p.getByRole('button', { name: 'Lưu nháp' }).click(); await p.waitForURL(/entries\/\d+/); S.entry = id(p); await p.close()
  })
  await sh.step('06 approve entry', async () => {
    const p = await sh.page('my.tp', '/moves'); await p.getByRole('button', { name: /Chờ duyệt/ }).click(); await sh.settle(p)
    await sh.shot(p, `${A}/11-cho-duyet`)
    await sh.go(p, `/entries/${S.entry}`); await p.getByRole('button', { name: 'Duyệt', exact: true }).click(); await sh.settle(p, 900)
    await sh.shot(p, `${A}/12-duyet-but-toan`, { hl: ['a[href^="/moves/"]'] })
    await sh.go(p, '/moves'); await sh.shot(p, `${A}/13-so-but-toan`)
    await p.locator('input[placeholder="Tìm kiếm…"]').fill('Khấu hao').catch(() => {}); await sh.settle(p, 700)
    await p.locator('tbody tr').first().click(); await sh.settle(p, 600)
    await sh.shot(p, `${A}/14-dao-but-toan`, { hl: [p.getByRole('button', { name: 'Đảo bút toán' })] }); await p.close()
  })
}

async function ch06b(sh, S) {
  await sh.step('06 reconcile', async () => {
    const p = await sh.page('my.tp', '/bank-reconcile'); await sh.shot(p, `${A}/15-doi-chieu`)
    const sg = p.getByRole('button', { name: 'Gợi ý' }); const n = Math.min(await sg.count(), 30)
    for (let i = 0; i < n; i++) { // find a statement line that really has a suggestion
      await sg.nth(i).click(); await p.waitForSelector('dialog[open]'); await sh.settle(p, 500)
      if (await p.locator('dialog[open]').getByRole('button', { name: 'Khớp dòng này' }).count() || i === n - 1) break
      await p.keyboard.press('Escape'); await sh.settle(p, 200)
    }
    await sh.shot(p, `${A}/16-goi-y`); await p.keyboard.press('Escape'); await sh.settle(p, 300)
    await p.getByRole('button', { name: 'Tạo bút toán' }).first().click(); await p.waitForSelector('dialog[open]')
    await p.selectOption('#e-kind', { index: 0 }).catch(() => {}); await sh.shot(p, `${A}/17-tao-but-toan-nh`); await p.keyboard.press('Escape'); await p.close()
  })
  await sh.step('06 import statement', async () => {
    const f = join(tmpdir(), 'sao-ke-mau.csv')
    writeFileSync(f, 'Ngày giao dịch;Số tham chiếu;Ghi nợ;Ghi có;Nội dung\n01/11/2026;FT26305001;0;12500000;CTY AN KHANG THANH TOAN HD\n01/11/2026;FT26305002;55000;0;PHI QUAN LY TAI KHOAN\n')
    const p = await sh.page('my.tp', '/bank-reconcile/import')
    await selStart(p.locator('#i-bank'), 'VCB'); await p.setInputFiles('#i-file', f); await sh.settle(p, 1200)
    await sh.shot(p, `${A}/18-nhap-sao-ke`); await bottom(p); await sh.shot(p, `${A}/18a-nhap-sao-ke-cuoi`); await p.close(); rmSync(f, { force: true })
  })
  await sh.step('06 rec report', async () => {
    const p = await sh.page('my.tp', '/bank-reconcile/report'); await sh.shot(p, `${A}/19-bao-cao-doi-chieu`, { full: true }); await p.close()
  })
  await sh.step('06 reports', async () => {
    const p = await sh.page('my.tp', '/account/reports')
    await p.locator('input[type=date]').first().fill('2026-08-01'); await p.locator('input[type=date]').first().press('Tab'); await sh.settle(p, 800)
    await sh.shot(p, `${A}/20-can-doi`)
    await p.getByRole('button', { name: 'Công nợ phải thu' }).click(); await sh.settle(p, 700); await sh.shot(p, `${A}/21a-cong-no`)
    await p.locator('tbody tr').first().click(); await sh.settle(p, 900); await p.locator('h2', { hasText: 'Sổ chi tiết' }).evaluate((e) => e.scrollIntoView({ block: 'start' })); await sh.shot(p, `${A}/21-cong-no-chi-tiet`)
    await p.getByRole('button', { name: 'Tuổi nợ' }).click(); await sh.settle(p, 700); await sh.shot(p, `${A}/22-tuoi-no`); await p.close()
  })
  await sh.step('06 chart', async () => {
    const p = await sh.page('admin', '/accounts'); await sh.shot(p, `${A}/23-he-thong-tk`, { hl: ['input[type=date]'] }); await p.close()
  })
}

const H = '07-nhan-su'
const tab = (p, name) => p.getByRole('tab', { name, exact: true })
async function ch07(sh, S) {
  await sh.step('07 hr settings (enable check-in)', async () => {
    const p = await sh.page('admin', '/settings/hrm')
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()) // server clock is real
    await p.locator('input[type=date]').first().fill(today)
    await sh.shot(p, `${H}/24-cau-hinh`, { hl: [p.locator('input[type=date]').first()] })
    await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await sh.settle(p, 700); await p.close()
  })
  await sh.step('07 my leave', async () => {
    const p = await sh.page('trung.bx', '/hrm/my-leave')
    await p.locator('input[name=date_from]').fill('2026-11-09'); await p.locator('input[name=date_to]').fill('2026-11-10')
    await selStart(p.locator('#my-leave select').first(), 'Nghỉ phép năm'); await lab(p, 'Lý do').fill('Việc gia đình')
    await sh.shot(p, `${H}/01-nghi-phep-cua-toi`)
    await p.getByRole('button', { name: 'Gửi duyệt' }).click(); await sh.settle(p, 900)
    await sh.shot(p, `${H}/02-don-da-gui`, { full: true }); await p.close()
    const m = await sh.page('trung.bx', '/hrm/my-leave', { phone: true }); await sh.shot(m, `${H}/03-nghi-phep-phone`); await m.close()
  })
  await sh.step('07 my attendance', async () => {
    const p = await sh.page('trung.bx', '/hrm/my-attendance'); 
    const ci = p.getByRole('button', { name: /Check-in/ }).first()
    if (await ci.isEnabled()) { await ci.click(); await sh.settle(p, 900) }
    await sh.shot(p, `${H}/04-cong-cua-toi`); await p.close()
    const m = await sh.page('trung.bx', '/hrm/my-attendance', { phone: true })
    await m.getByRole('button', { name: 'Đăng ký làm thêm giờ' }).click(); await m.waitForSelector('dialog[open]')
    await m.fill('input[name=date]', '2026-11-02'); await m.fill('input[name=start_time]', '18:00'); await m.fill('input[name=end_time]', '20:00'); await m.fill('input[name=reason]', 'Hỗ trợ khách lắp phòng máy')
    await sh.shot(m, `${H}/05-yeu-cau-lam-them-phone`)
    await m.locator('button[form=att-form]').click(); await sh.settle(m, 900); await m.close()
  })
  await sh.step('07 late + team', async () => {
    let p = await sh.page('trung.bx', '/hrm/my-late'); await sh.shot(p, `${H}/06-giai-trinh-tre`); await p.close()
    p = await sh.page('toan.pa', '/hrm/my-team'); await sh.shot(p, `${H}/07-duyet-cham-cong`); await p.close()
  })
  await sh.step('07 employees', async () => {
    const p = await sh.page('huy.pt', '/hrm/employees'); await sh.shot(p, `${H}/08-nhan-vien`)
    await p.locator('input[placeholder="Tìm kiếm…"]').fill('Bùi Xuân Trung'); await sh.settle(p, 800); await p.locator('tbody tr').first().click(); await p.waitForURL(/employees\/\d+/); await sh.settle(p)
    await sh.shot(p, `${H}/09-ho-so`)
    await tab(p, 'Cá nhân').click(); await sh.settle(p); await sh.shot(p, `${H}/10-ca-nhan`)
    await tab(p, 'Người phụ thuộc').click(); await sh.settle(p); await sh.shot(p, `${H}/10b-nguoi-phu-thuoc`)
    await tab(p, 'Hợp đồng').click(); await sh.settle(p); await sh.shot(p, `${H}/11-hop-dong-tab`)
    await tab(p, 'Lịch sử lương').click(); await sh.settle(p); await sh.shot(p, `${H}/12-lich-su-luong`); await p.close()
  })
  await sh.step('07 contracts', async () => {
    const p = await sh.page('huy.pt', '/hrm/contracts')
    await p.locator('label', { hasText: 'Sắp hết hạn' }).locator('input').check(); await sh.settle(p); await sh.shot(p, `${H}/13-hop-dong`, { hl: [p.locator('label', { hasText: 'Sắp hết hạn' })] })
    await p.locator('label', { hasText: 'Sắp hết hạn' }).locator('input').uncheck(); await sh.settle(p)
    await p.getByRole('button', { name: 'Hiệu lực', exact: true }).click().catch(() => {}); await sh.settle(p)
    await p.locator('tbody tr').first().click(); await p.waitForURL(/contracts\/\d+/); await sh.settle(p)
    await sh.shot(p, `${H}/14-hop-dong-form`); await bottom(p); await sh.shot(p, `${H}/15-phu-luc`); await p.close()
  })
  await sh.step('07 timesheets', async () => {
    let p = await sh.page('huy.pt', '/hrm/timesheets'); await sh.shot(p, `${H}/16-bang-cong`, { hl: ['#ts-period'] })
    await p.locator('tbody tr').first().click(); await p.waitForURL(/timesheets\/\d+/); await sh.settle(p); await sh.shot(p, `${H}/17-bang-cong-thang`); await p.close()
    p = await sh.page('huy.pt', '/hrm/timesheets'); await p.locator('tbody tr', { hasText: '2026-10' }).first().click(); await p.waitForURL(/timesheets\/\d+/); await sh.settle(p, 700)
    await p.locator('tbody tr').first().click(); await p.waitForSelector('dialog[open]'); await sh.shot(p, `${H}/18-sua-ngay-cong`)
    await p.evaluate(() => document.querySelectorAll('dialog[open] *').forEach((e) => { if (e.scrollWidth > e.clientWidth + 20) e.scrollLeft = e.scrollWidth }))
    await sh.shot(p, `${H}/18a-sua-ngay-cong-cot-nghi`); await p.close()
    p = await sh.page('dat.dv', '/hrm/timesheets'); await p.fill('#ts-period', '2026-11')
    await p.getByRole('button', { name: 'Tạo bảng công' }).click(); await p.waitForURL(/timesheets\/\d+/); S.ts = id(p); await sh.settle(p, 600)
    await p.getByRole('button', { name: 'Điền công chuẩn' }).click(); await sh.settle(p, 1000); await p.close()
    p = await sh.page('huy.pt', `/hrm/timesheets/${S.ts}`)
    await sh.shot(p, `${H}/18b-duyet-va-khoa`, { hl: [p.getByRole('button', { name: 'Duyệt và khoá' })] })
    await p.getByRole('button', { name: 'Duyệt và khoá' }).click(); await sh.settle(p, 1000); await p.close()
  })
  await sh.step('07 leaves', async () => {
    const p = await sh.page('huy.pt', '/hrm/leaves')
    await p.locator('select').first().selectOption({ label: 'Chờ duyệt' }); await sh.settle(p, 700)
    await sh.shot(p, `${H}/19-duyet-nghi`, { hl: [p.getByRole('button', { name: 'Duyệt', exact: true })] })
    await p.getByRole('button', { name: 'Từ chối' }).last().click(); await p.waitForSelector('dialog[open]'); await p.locator('dialog[open] input').fill('Trùng đợt cao điểm cuối quý')
    await sh.shot(p, `${H}/20-tu-choi-nghi`); await p.keyboard.press('Escape')
    await p.getByRole('button', { name: 'Duyệt', exact: true }).first().click(); await sh.settle(p, 800) // approve one so the next list differs
    await tab(p, 'Số dư phép').click(); await sh.settle(p, 700); await sh.shot(p, `${H}/21-so-du-phep`); await p.close()
  })
  await sh.step('07 requests/org/reports', async () => {
    let p = await sh.page('huy.pt', '/hrm/attendance'); await sh.shot(p, `${H}/22-yeu-cau-cong`); await p.close()
    p = await sh.page('huy.pt', '/hrm/org'); await sh.shot(p, `${H}/23-to-chuc`); await p.close()
    p = await sh.page('huy.pt', '/hrm/reports'); await sh.shot(p, `${H}/25-bao-cao`); await p.close()
  })
}

const L = '08-tien-luong'
const selMatch = (loc, re) => loc.evaluate((e, src) => { const o = [...e.options].find((x) => new RegExp(src).test(x.text)); e.value = o.value; e.dispatchEvent(new Event('change', { bubbles: true })) }, re)
async function ch08(sh, S) {
  await sh.step('08 runs', async () => {
    const p = await sh.page('hoa.tp', '/payroll/runs'); await sh.shot(p, `${L}/01-bang-luong`); await p.close()
  })
  await sh.step('08 new run', async () => {
    const p = await sh.page('huy.pt', '/payroll/runs')
    await p.getByRole('button', { name: 'Tạo bảng lương' }).click(); await p.waitForSelector('dialog[open]')
    await p.fill('#run-period', '2026-11'); await p.fill('#run-date', '2026-11-30')
    await sh.shot(p, `${L}/02-tao-bang-luong`)
    await p.locator('dialog[open] button.btn-primary').click(); await p.waitForURL(/payroll\/runs\/\d+/); S.run = id(p); await sh.settle(p, 900)
    await sh.shot(p, `${L}/03b-bang-luong-nhap-moi`, { hl: [p.getByRole('button', { name: 'Tính lại' })] })
    await sh.go(p, '/payroll/runs'); await p.locator('tbody tr', { hasText: '2026-10' }).first().click(); await p.waitForURL(/payroll\/runs\/\d+/); S.oct = id(p); await sh.settle(p, 900)
    await sh.shot(p, `${L}/03-bang-luong`)
    await p.locator('tbody tr').first().click(); await p.waitForURL(/payroll\/slips\/\d+/); await sh.settle(p, 700)
    await sh.shot(p, `${L}/04-phieu-luong`)
    // "Khoản nhập tay" only renders on a draft run's slip, so use the November draft
    await sh.go(p, `/payroll/runs/${S.run}`); await p.locator('tbody tr').first().click(); await p.waitForURL(/payroll\/slips\/\d+/); await sh.settle(p, 700)
    await bottom(p); await sh.shot(p, `${L}/04b-khoan-nhap-tay`, { hl: [p.getByRole('button', { name: 'Thêm khoản' })] }); await p.close()
  })
  await sh.step('08 post run', async () => {
    // the new November draft stays a draft (its timesheet is nearly empty); the October run shows what "posted" looks like
    let p = await sh.page('hoa.tp', `/payroll/runs/${S.run}`)
    await sh.shot(p, `${L}/05a-nut-hach-toan`, { hl: [p.getByRole('button', { name: 'Hạch toán', exact: true })] }); await p.close()
    p = await sh.page('hoa.tp', `/payroll/runs/${S.oct}`); await sh.shot(p, `${L}/05-hach-toan`, { hl: ['a[href^="/moves/"]'] }); await p.close()
  })
  await sh.step('08 payment', async () => {
    const p = await sh.page('hoa.tp', '/payroll/payments/new')
    await selMatch(p.locator('select[name=run]'), '10/2026|2026-10'); await sh.settle(p, 900)
    await sh.shot(p, `${L}/06-chi-luong-moi`)
    await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await p.waitForURL(/payments\/\d+/); await sh.settle(p, 700)
    await p.getByRole('button', { name: 'Duyệt chi' }).click(); await sh.settle(p, 1200)
    await sh.shot(p, `${L}/07-chi-luong-duyet`); await p.close()
  })
  await sh.step('08 advances', async () => {
    let p = await sh.page('hoa.tp', '/payroll/advances'); await sh.shot(p, `${L}/08-tam-ung`); await p.close()
    p = await sh.page('huy.pt', '/payroll/advances/new')
    await sh.pick(p, 'employee', 'Bùi Xuân Trung'); await p.fill('input[name=date]', '2026-11-01'); await p.fill('input[name=period]', '2026-12'); await p.fill('input[name=amount]', '3000000')
    await sh.shot(p, `${L}/09-tam-ung-moi`, { hl: [p.getByRole('button', { name: 'Lưu', exact: true })] })
    await p.getByRole('button', { name: 'Lưu', exact: true }).click(); await sh.settle(p, 800); await p.close()
  })
  await sh.step('08 reports/config', async () => {
    let p = await sh.page('hoa.tp', '/payroll/reports'); await selMatch(p.locator('#rep-run'), '10/2026|2026-10'); await sh.settle(p, 500); await sh.shot(p, `${L}/10-bao-cao`); await p.close()
    p = await sh.page('hoa.tp', '/payroll/params'); await sh.shot(p, `${L}/11-tham-so`); await p.close()
    p = await sh.page('hoa.tp', '/payroll/components'); await sh.shot(p, `${L}/12-khoan-luong`); await p.close()
    p = await sh.page('hoa.tp', '/settings/payroll'); await sh.shot(p, `${L}/13-cau-hinh`); await p.close()
  })
  await sh.step('08 my payslips', async () => {
    const p = await sh.page('trung.bx', '/payroll/my-payslips'); await sh.shot(p, `${L}/14-phieu-cua-toi`)
    await p.locator('tbody tr, ul li a, a[href*="my-payslips/"]').first().click(); await sh.settle(p, 800); await sh.shot(p, `${L}/15-phieu-cua-toi-chi-tiet`, { hl: [p.getByRole('button', { name: 'In phiếu lương' })] }); await p.close()
    const m = await sh.page('trung.bx', '/payroll/my-payslips', { phone: true })
    await m.locator('tbody tr, ul li a, a[href*="my-payslips/"]').first().click(); await sh.settle(m, 800); await sh.shot(m, `${L}/16-phieu-phone`); await m.close()
  })
}
const I = '09-nhap-du-lieu', Q = '10-quan-tri', T = '11-ket-noi-ai'
async function ch09(sh, S) {
  await sh.step('09 import', async () => {
    const f = join(tmpdir(), 'khach-hang-mau.csv')
    writeFileSync(f, 'Mã KH;Tên khách hàng;Mã số thuế;Điện thoại\nKH900;Công ty TNHH Thương mại Hà Đông;0109990001;0912000001\nKH901;Trường Tiểu học Quang Trung;0109990002;0912000002\n')
    const p = await sh.page('admin', '/import'); await sh.shot(p, `${I}/01-trang-chu`)
    await sh.go(p, '/import/contacts'); await sh.shot(p, `${I}/02a-chon-tep`)
    await p.setInputFiles('#i-file', f); await sh.settle(p, 1500); await sh.shot(p, `${I}/02-ghep-cot`, { full: true })
    await p.locator('#pv-h').scrollIntoViewIfNeeded().catch(() => {}); await sh.shot(p, `${I}/03-xem-truoc`)
    await p.getByRole('button', { name: 'Nhập dữ liệu', exact: true }).click(); await sh.settle(p, 1500); await sh.shot(p, `${I}/04-da-nhap`, { toast: true })
    await sh.go(p, '/import'); await sh.shot(p, `${I}/05a-danh-sach-lan-nhap`); await p.locator('tbody tr').first().click(); await p.waitForURL(/batches\/\d+/); await sh.settle(p); await sh.shot(p, `${I}/05-lan-nhap`)
    await p.close(); rmSync(f, { force: true })
  })
}
async function ch10(sh, S) {
  await sh.step('10 users/roles', async () => {
    const p = await sh.page('admin', '/users'); await sh.shot(p, `${Q}/01-nguoi-dung`)
    await p.locator('tbody tr', { hasText: 'Bùi Xuân Trung' }).first().click(); await p.waitForSelector('dialog[open]'); await sh.shot(p, `${Q}/02-nguoi-dung-modal`); await p.keyboard.press('Escape')
    await sh.go(p, '/roles'); await sh.shot(p, `${Q}/03-vai-tro`)
    await p.getByText('Nhân viên kinh doanh', { exact: true }).first().click(); await p.waitForSelector('dialog[open]'); await sh.settle(p, 500)
    await sh.shot(p, `${Q}/04-ma-tran-quyen`); await p.close()
  })
  await sh.step('10 settings', async () => {
    const p = await sh.page('admin', '/apps'); await sh.shot(p, `${Q}/05-ung-dung`)
    await sh.go(p, '/settings/company'); await sh.shot(p, `${Q}/06-cong-ty`)
    await sh.go(p, '/settings/company?tab=bank'); await sh.shot(p, `${Q}/07-tk-ngan-hang`)
    await sh.go(p, '/settings/company?tab=signer'); await sh.shot(p, `${Q}/08-chu-ky-so`)
    await sh.go(p, '/settings/accounting'); await sh.shot(p, `${Q}/09-chuan-muc`, { full: true })
    await sh.go(p, '/settings/invoice-templates'); await sh.shot(p, `${Q}/10-mau-in`)
    await p.locator('a[href^="/settings/invoice-templates/"]:not([href$="/new"])').first().click(); await p.waitForURL(/invoice-templates\/\d+/); await sh.settle(p, 3000); await sh.shot(p, `${Q}/11-mau-in-form`); await p.close()
  })
}
async function ch11(sh, S) {
  await sh.step('11 tokens', async () => {
    const p = await sh.page('hoa.tp', '/settings/api-tokens'); await sh.shot(p, `${T}/01-ma-truy-cap`)
    await p.getByRole('button', { name: 'Tạo mã' }).click(); await p.fill('#tk-name', 'Claude Desktop'); await sh.shot(p, `${T}/02-tao-ma`)
    await p.locator('dialog[open] button.btn-primary').click(); await p.waitForSelector('dialog[open] pre'); await sh.settle(p, 500)
    // never publish a live token: blur every code block in the reveal dialog
    await p.addStyleTag({ content: 'dialog[open] pre { filter: blur(7px); user-select: none }' })
    await sh.shot(p, `${T}/03-ma-moi`)
    await p.getByRole('button', { name: 'Xong' }).click(); await sh.settle(p, 600); await sh.shot(p, `${T}/04-danh-sach-ma`)
    await p.getByRole('button', { name: 'Thu hồi' }).first().click(); await sh.settle(p, 800) // revoke the demo token
    await p.close()
  })
}
export const chapters = [['01', async (sh, S) => { await ch01(sh, S); await ch01b(sh, S) }], ['02', ch02], ['03', ch03], ['04', async (sh, S) => { await ch04(sh, S); await ch05(sh, S); await ch04b(sh, S); await ch05b(sh, S) }], ['06', async (sh, S) => { await ch06(sh, S); await ch06b(sh, S) }], ['07', ch07], ['08', ch08], ['09', ch09], ['10', ch10], ['11', ch11]]
