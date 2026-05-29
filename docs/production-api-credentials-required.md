# Hship — Production API Credentials Required

## Overview

This document lists all external API credentials needed to activate each module in **production mode**.
Modules without credentials will operate in **mock** or **sandbox** mode and will fail clearly if forced to production.

---

## 1. Carrier / Shipping APIs

### GHN (Giao Hàng Nhanh)
- **Status:** Mock/Sandbox ready. Production requires:
  - API Token (từ https://5sao.ghn.dev/account/login)
  - Shop ID (shopId trong GHN merchant account)
- **Where to configure:** `/customer/partners/shippers` → Edit GHN → nhập API Key + Token → chọn mode `production`

### GHTK (Giao Hàng Tiết Kiệm)
- **Status:** Mock ready. Production requires:
  - API Token (từ https://khachhang.giaohangtietkiem.vn)
- **Where to configure:** `/customer/partners/shippers` → Edit GHTK

### J&T Express
- **Status:** Mock ready. Production requires:
  - API Key + Customer Code (từ J&T partner portal)
- **Where to configure:** `/customer/partners/shippers` → Edit JT

### SPX (Shopee Xpress)
- **Status:** Mock ready. Production requires:
  - SPX Partner credentials (only available via Shopee Seller integration)
- **Where to configure:** `/customer/partners/shippers` → Edit SPX

---

## 2. Facebook / Chatbot

- **Status:** Mock mode (fake comment simulation). Production requires:
  - **Facebook App ID** — from Meta Developer console
  - **App Secret** — env var `FACEBOOK_APP_SECRET`
  - **Verify Token** — custom string, env var `FACEBOOK_VERIFY_TOKEN`
  - **Page Access Token** — configured per-shop in `/customer/channels/facebook`
  - **Webhook URL** must be HTTPS: `https://yourdomain.vn/api/facebook/webhook`

---

## 3. Ecommerce Channels (Shopee / Lazada / TikTok Shop)

- **Status:** Mock sync only. Production requires:
  - **Shopee:** App Key + App Secret từ Shopee Open Platform (https://open.shopee.com)
  - **Lazada:** App Key + App Secret từ Lazada Open Platform
  - **TikTok Shop:** App Key + App Secret từ TikTok Shop Developer
- **Note:** Each shop connects their own channel account per platform in `/customer/channels/ecommerce`

---

## 4. E-Invoice (MISA / VNPT)

- **Status:** Sandbox (mock providerInvoiceId). Production requires:
  - **MISA:** App ID + API Key từ MISA SME (configured per-shop in ShopConfig)
  - **VNPT:** Partner credentials từ VNPT e-invoice portal
- **Where to configure:** Admin sets per-shop MISA credentials in `/admin/shops/[id]`

---

## 5. Platform Credentials (Vercel ENV)

These must be set in Vercel before go-live:

| Variable | Source | Required |
|---|---|---|
| `DATABASE_URL` | Railway MySQL | ✅ |
| `SESSION_SECRET` | Generate locally | ✅ |
| `ENCRYPTION_KEY` | Generate locally | ✅ |
| `NEXT_PUBLIC_APP_URL` | Vercel domain | ✅ |
| `WEBHOOK_SECRET` | Generate locally | ✅ |
| `FACEBOOK_APP_SECRET` | Meta Developer | When using FB |
| `FACEBOOK_VERIFY_TOKEN` | Custom string | When using FB |

---

## Summary Table

| Module | Current Mode | Needs for Production |
|---|---|---|
| GHN Carrier | Mock/Sandbox | API Token + Shop ID |
| GHTK Carrier | Mock/Sandbox | API Token |
| J&T Carrier | Mock/Sandbox | API Key + Customer Code |
| SPX Carrier | Mock | SPX Partner credentials |
| Facebook Chatbot | Mock | App Secret + Verify Token + Page Token |
| Shopee Ecommerce | Mock | Shopee Open Platform Key/Secret |
| Lazada Ecommerce | Mock | Lazada Open Platform Key/Secret |
| TikTok Ecommerce | Mock | TikTok Shop Key/Secret |
| MISA Invoice | Sandbox | MISA App ID + API Key |
| VNPT Invoice | Sandbox | VNPT Partner credentials |
| Orders, POS, Inventory | ✅ Production Ready | None (uses own DB) |
| Admin/Shop Portal | ✅ Production Ready | None |
| COD Reports | ✅ Production Ready | None |
