#!/bin/bash

echo "🐳 تثبيت Docker و Docker Compose..."

# تحديث النظام
apt-get update

# تثبيت المتطلبات
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# إضافة مفتاح Docker GPG
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# إضافة مستودع Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# تحديث قائمة الحزم
apt-get update

# تثبيت Docker
apt-get install -y docker-ce docker-ce-cli containerd.io

# تثبيت Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# إنشاء رابط رمزي
ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# تشغيل Docker
systemctl start docker
systemctl enable docker

# إضافة المستخدم الحالي لمجموعة docker
usermod -aG docker $USER

echo "✅ تم تثبيت Docker و Docker Compose بنجاح!"
echo "🔄 يرجى إعادة تسجيل الدخول أو تشغيل: newgrp docker"
