#!/bin/bash

# ألوان
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== تثبيت WhatsApp Manager CLI ===${NC}"

# التحقق من صلاحيات الجذر
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ يجب تشغيل هذا السكريبت بصلاحيات الجذر (root)${NC}"
  echo -e "${YELLOW}جرب: sudo ./install.sh${NC}"
  exit 1
fi

# نسخ wa-manager.sh إلى /usr/local/bin
echo -e "${YELLOW}⏳ تثبيت wa-manager في النظام...${NC}"
cp wa-manager.sh /usr/local/bin/wa-manager
chmod +x /usr/local/bin/wa-manager

echo -e "${GREEN}✅ تم تثبيت wa-manager بنجاح!${NC}"
echo -e "${YELLOW}يمكنك الآن استخدام الأمر 'wa-manager' من أي مكان${NC}"
echo ""
echo -e "${BLUE}للبدء، جرب:${NC}"
echo -e "${GREEN}wa-manager help${NC} - لعرض المساعدة"
echo -e "${GREEN}wa-manager install docker${NC} - لتثبيت Docker"
echo -e "${GREEN}wa-manager install full${NC} - للتثبيت الكامل مع SSL"
