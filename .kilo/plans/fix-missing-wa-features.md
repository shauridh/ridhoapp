# Plan: Commit & Push Missing WA Features

**Masalah:** Field nomor WA di payment modal dan test WA di settings hilang dari production karena ada uncommitted changes yang tidak ikut push.

**Root Cause:**

- Perubahan ada di working directory tapi tidak di-stage/commit
- Saat push UI/UX improvements, perubahan ini tertinggal
- File `wa-debug.tsx` juga untracked (belum pernah di-add)

---

## Files Affected

### Uncommitted Changes:

1. `app/(internal)/pos/payment-modal.tsx`
   - Tambah state `customerPhone`
   - Tambah input field nomor WA pelanggan
   - Pass `customerPhone` ke `onConfirm()`

2. `app/(internal)/settings/whatsapp/whatsapp-form.tsx`
   - Import `WaDebug` component
   - Render `<WaDebug />` di bawah form

### Untracked Files:

3. `app/(internal)/settings/whatsapp/wa-debug.tsx`
   - Component untuk test kirim WA
   - Tombol test text & test media

---

## Tasks

- [ ] Stage perubahan payment-modal.tsx
- [ ] Stage perubahan whatsapp-form.tsx
- [ ] Add wa-debug.tsx (untracked file)
- [ ] Commit dengan pesan yang jelas
- [ ] Push ke main
- [ ] Verify build passes

---

## Commit Message

```
feat(pos,settings): add customer WA field & WA debug tool

- Payment modal: tambah optional field nomor WA pelanggan untuk auto-send struk
- WhatsApp settings: tambah WA debug panel untuk test koneksi
- Add wa-debug component dengan test text & media message

Fixes missing WA features that were left uncommitted
```

---

## Verification

1. Build should pass
2. Payment modal menampilkan field "No. WA Pelanggan"
3. Settings > WhatsApp menampilkan panel "Test Koneksi WA"
4. Auto-send struk WA tetap berfungsi
5. Manual share dari receipt modal tetap berfungsi
