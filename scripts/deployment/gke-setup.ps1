<#
.SYNOPSIS
    سكربت إعداد البنية التحتية لمنصة LearnNov على Google Kubernetes Engine
.DESCRIPTION
    يقوم هذا السكربت بإنشاء جميع موارد GCP المطلوبة لتشغيل منصة LearnNov
    بما في ذلك: VPC، GKE Autopilot، Cloud SQL، Redis، Artifact Registry، وغيرها
.NOTES
    المشروع: LearnNov - منصة التعلم المبتكرة
    النطاق: learnnov.org
    التاريخ: 2026-05-22
#>

# ══════════════════════════════════════════════════════════════
# إيقاف التنفيذ عند حدوث أي خطأ
# ══════════════════════════════════════════════════════════════
# $ErrorActionPreference = 'Stop'

# ══════════════════════════════════════════════════════════════
# المتغيرات الأساسية للمشروع
# ══════════════════════════════════════════════════════════════
$PROJECT_ID       = "project-26dbc415-dd49-4210-ada"
$REGION           = "me-central1"
$CLUSTER_NAME     = "learnnov-cluster"
$SQL_INSTANCE     = "learnnov-db"
$REDIS_INSTANCE   = "learnnov-redis"
$REGISTRY_REPO    = "learnnov"
$GCS_BUCKET       = "learnnov-static-assets"
$SERVICE_ACCOUNT  = "learnnov-gke-sa"
$VPC_NAME         = "learnnov-vpc"
$DOMAIN           = "learnnov.org"
$STATIC_IP_NAME   = "learnnov-ip"
$DB_NAME          = "learnnov_db"
$DB_USER          = "learnnov"
$K8S_NAMESPACE    = "learnnov"
$K8S_SA           = "learnnov-ksa"

# ══════════════════════════════════════════════════════════════
# ألوان الإخراج
# ══════════════════════════════════════════════════════════════
$Green  = "Green"
$Yellow = "Yellow"
$Cyan   = "Cyan"
$Red    = "Red"
$White  = "White"
$Magenta = "Magenta"

# ══════════════════════════════════════════════════════════════
# دوال مساعدة
# ══════════════════════════════════════════════════════════════
function Write-Step {
    param([string]$StepNumber, [string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Cyan
    Write-Host "  [$StepNumber] $Message" -ForegroundColor $Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor $Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor $Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ️  $Message" -ForegroundColor $Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "  ❌ $Message" -ForegroundColor $Red
}

# ══════════════════════════════════════════════════════════════
# شعار المنصة
# ══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor $Magenta
Write-Host "  ║                                                      ║" -ForegroundColor $Magenta
Write-Host "  ║     LearnNov Platform - إعداد البنية التحتية        ║" -ForegroundColor $Magenta
Write-Host "  ║     Google Kubernetes Engine (GKE) Setup              ║" -ForegroundColor $Magenta
Write-Host "  ║                                                      ║" -ForegroundColor $Magenta
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor $Magenta
Write-Host ""
Write-Host "  المشروع: $PROJECT_ID" -ForegroundColor $White
Write-Host "  المنطقة: $REGION" -ForegroundColor $White
Write-Host "  النطاق:  $DOMAIN" -ForegroundColor $White
Write-Host ""

# ──────────────────────────────────────────────────────────────
# الخطوة 1: تعيين المشروع النشط
# ──────────────────────────────────────────────────────────────
Write-Step "1/13" "تعيين المشروع النشط في gcloud"

try {
    gcloud config set project $PROJECT_ID 
    Write-Success "تم تعيين المشروع: $PROJECT_ID"
} catch {
    Write-Err "فشل تعيين المشروع. تأكد من تسجيل الدخول: gcloud auth login"
    throw $_
}

# ──────────────────────────────────────────────────────────────
# الخطوة 2: تفعيل واجهات برمجة التطبيقات المطلوبة
# ──────────────────────────────────────────────────────────────
Write-Step "2/13" "تفعيل واجهات برمجة التطبيقات (APIs)"

$APIs = @(
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com",
    "servicenetworking.googleapis.com"
)

foreach ($api in $APIs) {
    try {
        Write-Info "جارٍ تفعيل: $api"
        gcloud services enable $api  
        Write-Success "تم تفعيل: $api"
    } catch {
        Write-Err "فشل تفعيل: $api"
        throw $_
    }
}

# ──────────────────────────────────────────────────────────────
# الخطوة 3: إنشاء شبكة VPC خاصة
# ──────────────────────────────────────────────────────────────
Write-Step "3/13" "إنشاء شبكة VPC للخدمات الخاصة"

# التحقق من وجود الشبكة مسبقاً
$existingVpc = gcloud compute networks list --filter="name=$VPC_NAME" --format="value(name)" 2>$null
if ($existingVpc) {
    Write-Info "شبكة VPC موجودة مسبقاً: $VPC_NAME"
} else {
    try {
        # إنشاء شبكة VPC
        Write-Info "جارٍ إنشاء شبكة VPC: $VPC_NAME"
        gcloud compute networks create $VPC_NAME `
            --subnet-mode=auto `
             
        Write-Success "تم إنشاء شبكة VPC: $VPC_NAME"
    } catch {
        Write-Err "فشل إنشاء شبكة VPC"
        throw $_
    }
}

# تخصيص نطاق IP خاص للخدمات
$existingRange = gcloud compute addresses list --filter="name=learnnov-private-range" --format="value(name)" 2>$null
if ($existingRange) {
    Write-Info "نطاق IP الخاص موجود مسبقاً"
} else {
    try {
        Write-Info "جارٍ تخصيص نطاق IP خاص للخدمات المُدارة"
        gcloud compute addresses create learnnov-private-range `
            --global `
            --purpose=VPC_PEERING `
            --addresses=10.100.0.0 `
            --prefix-length=20 `
            --network=$VPC_NAME `
             
        Write-Success "تم تخصيص نطاق IP الخاص: 10.100.0.0/20"
    } catch {
        Write-Err "فشل تخصيص نطاق IP الخاص"
        throw $_
    }
}

# إنشاء اتصال الخدمات الخاصة
try {
    Write-Info "جارٍ إنشاء اتصال الخدمات الخاصة (Private Services Connection)"
    gcloud services vpc-peerings connect `
        --service=servicenetworking.googleapis.com `
        --ranges=learnnov-private-range `
        --network=$VPC_NAME `
         
    Write-Success "تم إنشاء اتصال الخدمات الخاصة"
} catch {
    # قد يكون الاتصال موجوداً مسبقاً
    Write-Info "اتصال الخدمات الخاصة قد يكون موجوداً مسبقاً - متابعة..."
}

# ──────────────────────────────────────────────────────────────
# الخطوة 4: إنشاء Artifact Registry
# ──────────────────────────────────────────────────────────────
Write-Step "4/13" "إنشاء مستودع Artifact Registry لصور Docker"

$existingRepo = gcloud artifacts repositories list --location=$REGION --filter="name~$REGISTRY_REPO" --format="value(name)" 2>$null
if ($existingRepo) {
    Write-Info "مستودع Artifact Registry موجود مسبقاً: $REGISTRY_REPO"
} else {
    try {
        gcloud artifacts repositories create $REGISTRY_REPO `
            --repository-format=docker `
            --location=$REGION `
            --description="LearnNov Platform Docker Images" `
             
        Write-Success "تم إنشاء مستودع Artifact Registry: $REGISTRY_REPO"
    } catch {
        Write-Err "فشل إنشاء مستودع Artifact Registry"
        throw $_
    }
}

# ──────────────────────────────────────────────────────────────
# الخطوة 5: إنشاء عنقود GKE Autopilot
# ──────────────────────────────────────────────────────────────
Write-Step "5/13" "إنشاء عنقود GKE Autopilot (قد يستغرق 5-10 دقائق)"

$existingCluster = gcloud container clusters list --region=$REGION --filter="name=$CLUSTER_NAME" --format="value(name)" 2>$null
if ($existingCluster) {
    Write-Info "عنقود GKE موجود مسبقاً: $CLUSTER_NAME"
} else {
    try {
        Write-Info "جارٍ إنشاء العنقود... يرجى الانتظار"
        gcloud container clusters create-auto $CLUSTER_NAME `
            --region=$REGION `
            --network=$VPC_NAME `
             
        Write-Success "تم إنشاء عنقود GKE Autopilot: $CLUSTER_NAME"
    } catch {
        Write-Err "فشل إنشاء عنقود GKE"
        throw $_
    }
}

# ──────────────────────────────────────────────────────────────
# الخطوة 6: إنشاء Cloud SQL PostgreSQL 15
# ──────────────────────────────────────────────────────────────
Write-Step "6/13" "إنشاء قاعدة بيانات Cloud SQL PostgreSQL 15 (قد يستغرق 5-10 دقائق)"

$existingSql = gcloud sql instances list --filter="name=$SQL_INSTANCE" --format="value(name)" 2>$null
if ($existingSql) {
    Write-Info "مثيل Cloud SQL موجود مسبقاً: $SQL_INSTANCE"
} else {
    try {
        Write-Info "جارٍ إنشاء مثيل Cloud SQL..."
        gcloud sql instances create $SQL_INSTANCE `
            --database-version=POSTGRES_15 `
            --tier=db-f1-micro `
            --region=$REGION `
            --network="projects/$PROJECT_ID/global/networks/$VPC_NAME" `
            --no-assign-ip `
            --storage-auto-increase `
            --availability-type=zonal `
             
        Write-Success "تم إنشاء مثيل Cloud SQL: $SQL_INSTANCE"
    } catch {
        Write-Err "فشل إنشاء مثيل Cloud SQL"
        throw $_
    }
}

# إنشاء قاعدة البيانات
try {
    Write-Info "جارٍ إنشاء قاعدة البيانات: $DB_NAME"
    gcloud sql databases create $DB_NAME `
        --instance=$SQL_INSTANCE `
         
    Write-Success "تم إنشاء قاعدة البيانات: $DB_NAME"
} catch {
    Write-Info "قاعدة البيانات قد تكون موجودة مسبقاً - متابعة..."
}

# توليد كلمة مرور آمنة وإنشاء المستخدم
$DB_PASSWORD = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
try {
    Write-Info "جارٍ إنشاء مستخدم قاعدة البيانات: $DB_USER"
    gcloud sql users create $DB_USER `
        --instance=$SQL_INSTANCE `
        --password=$DB_PASSWORD `
         
    Write-Success "تم إنشاء مستخدم قاعدة البيانات: $DB_USER"
} catch {
    Write-Info "المستخدم قد يكون موجوداً مسبقاً - تحديث كلمة المرور..."
    gcloud sql users set-password $DB_USER `
        --instance=$SQL_INSTANCE `
        --password=$DB_PASSWORD `
         
}

# تخزين كلمة المرور في Secret Manager
try {
    Write-Info "جارٍ تخزين كلمة المرور في Secret Manager"
    # حذف السر القديم إن وجد
    gcloud secrets delete learnnov-db-password  2>$null
    # إنشاء السر الجديد
    $DB_PASSWORD | gcloud secrets create learnnov-db-password `
        --data-file=- `
        --replication-policy=user-managed `
        --locations=$REGION `
         
    Write-Success "تم تخزين كلمة المرور في Secret Manager: learnnov-db-password"
} catch {
    Write-Info "تخطي تخزين كلمة المرور - قد يكون موجوداً مسبقاً"
}

# ──────────────────────────────────────────────────────────────
# الخطوة 7: إنشاء Memorystore Redis
# ──────────────────────────────────────────────────────────────
Write-Step "7/13" "إنشاء Memorystore Redis 7.0 (قد يستغرق 5 دقائق)"

$existingRedis = gcloud redis instances list --region=$REGION --filter="name~$REDIS_INSTANCE" --format="value(name)" 2>$null
if ($existingRedis) {
    Write-Info "مثيل Redis موجود مسبقاً: $REDIS_INSTANCE"
} else {
    try {
        gcloud redis instances create $REDIS_INSTANCE `
            --size=1 `
            --region=$REGION `
            --network=$VPC_NAME `
            --redis-version=redis_7_0 `
             
        Write-Success "تم إنشاء مثيل Redis: $REDIS_INSTANCE"
    } catch {
        Write-Err "فشل إنشاء مثيل Redis"
        throw $_
    }
}

# ──────────────────────────────────────────────────────────────
# الخطوة 8: إنشاء حاوية GCS للملفات الثابتة
# ──────────────────────────────────────────────────────────────
Write-Step "8/13" "إنشاء حاوية Cloud Storage للملفات الثابتة"

$existingBucket = gsutil ls "gs://$GCS_BUCKET" 2>$null
if ($existingBucket) {
    Write-Info "حاوية GCS موجودة مسبقاً: $GCS_BUCKET"
} else {
    try {
        gsutil mb -l $REGION "gs://$GCS_BUCKET/"
        Write-Success "تم إنشاء حاوية GCS: gs://$GCS_BUCKET/"
    } catch {
        Write-Err "فشل إنشاء حاوية GCS"
        throw $_
    }
}

# تفعيل CORS للحاوية لدعم تحميل الملفات من المتصفح
$corsConfig = @"
[
  {
    "origin": ["https://learnnov.org", "https://studio.learnnov.org"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
"@
$corsFile = [System.IO.Path]::GetTempPath() + "learnnov-cors.json"
$corsConfig | Out-File -FilePath $corsFile -Encoding utf8 -Force
try {
    gsutil cors set $corsFile "gs://$GCS_BUCKET" 
    Write-Success "تم تعيين إعدادات CORS للحاوية"
} catch {
    Write-Info "تخطي إعداد CORS"
} finally {
    Remove-Item $corsFile -ErrorAction SilentlyContinue
}

# تفعيل سياسة الاحتفاظ (Lifecycle Policy) لحذف النسخ الاحتياطية القديمة (بعد 30 يوماً)
$lifecycleConfig = @"
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }
  ]
}
"@
$lifecycleFile = [System.IO.Path]::GetTempPath() + "learnnov-lifecycle.json"
$lifecycleConfig | Out-File -FilePath $lifecycleFile -Encoding utf8 -Force
try {
    gsutil lifecycle set $lifecycleFile "gs://$GCS_BUCKET"
    Write-Success "تم تعيين سياسة الاحتفاظ (30 يوم) للحاوية"
} catch {
    Write-Info "تخطي إعداد سياسة الاحتفاظ"
} finally {
    Remove-Item $lifecycleFile -ErrorAction SilentlyContinue
}

# ──────────────────────────────────────────────────────────────
# الخطوة 9: إنشاء حساب الخدمة وربط الأدوار
# ──────────────────────────────────────────────────────────────
Write-Step "9/13" "إنشاء حساب الخدمة وربط أدوار IAM"

$SA_EMAIL = "$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"

# إنشاء حساب الخدمة
$existingSa = gcloud iam service-accounts list --filter="email=$SA_EMAIL" --format="value(email)" 2>$null
if ($existingSa) {
    Write-Info "حساب الخدمة موجود مسبقاً: $SA_EMAIL"
} else {
    try {
        gcloud iam service-accounts create $SERVICE_ACCOUNT `
            --display-name="LearnNov GKE Service Account" `
            --description="حساب الخدمة لمنصة LearnNov على GKE" `
             
        Write-Success "تم إنشاء حساب الخدمة: $SA_EMAIL"
    } catch {
        Write-Err "فشل إنشاء حساب الخدمة"
        throw $_
    }
}

# ربط الأدوار المطلوبة
$roles = @(
    "roles/cloudsql.client",
    "roles/storage.objectAdmin",
    "roles/monitoring.metricWriter",
    "roles/logging.logWriter",
    "roles/artifactregistry.reader"
)

foreach ($role in $roles) {
    try {
        Write-Info "جارٍ ربط الدور: $role"
        gcloud projects add-iam-policy-binding $PROJECT_ID `
            --member="serviceAccount:$SA_EMAIL" `
            --role=$role `
            --condition=None `
             
        Write-Success "تم ربط الدور: $role"
    } catch {
        Write-Err "فشل ربط الدور: $role"
        throw $_
    }
}

# السماح لحساب الخدمة بالوصول إلى الأسرار
try {
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$SA_EMAIL" `
        --role="roles/secretmanager.secretAccessor" `
        --condition=None `
         
    Write-Success "تم ربط دور الوصول إلى Secret Manager"
} catch {
    Write-Info "تخطي ربط دور Secret Manager"
}

# ──────────────────────────────────────────────────────────────
# الخطوة 10: ربط Workload Identity
# ──────────────────────────────────────────────────────────────
Write-Step "10/13" "ربط Workload Identity بين حساب GCP وحساب Kubernetes"

try {
    # ربط حساب Kubernetes بحساب GCP عبر Workload Identity
    gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL `
        --role="roles/iam.workloadIdentityUser" `
        --member="serviceAccount:$PROJECT_ID.svc.id.goog[$K8S_NAMESPACE/$K8S_SA]" `
         
    Write-Success "تم ربط Workload Identity: $K8S_NAMESPACE/$K8S_SA -> $SA_EMAIL"
} catch {
    Write-Info "تخطي ربط Workload Identity - قد يكون موجوداً أو الـ namespace غير منشأ بعد"
}

# ──────────────────────────────────────────────────────────────
# الخطوة 11: الحصول على بيانات اعتماد العنقود
# ──────────────────────────────────────────────────────────────
Write-Step "11/13" "الحصول على بيانات اعتماد عنقود GKE"

try {
    gcloud container clusters get-credentials $CLUSTER_NAME `
        --region=$REGION `
         
    Write-Success "تم الحصول على بيانات اعتماد العنقود: $CLUSTER_NAME"
    Write-Info "يمكنك الآن استخدام kubectl للتحكم في العنقود"
} catch {
    Write-Err "فشل الحصول على بيانات اعتماد العنقود"
    throw $_
}

# ──────────────────────────────────────────────────────────────
# الخطوة 12: حجز عنوان IP ثابت لموازن الحمل
# ──────────────────────────────────────────────────────────────
Write-Step "12/13" "حجز عنوان IP ثابت عالمي لموازن الحمل"

$existingIp = gcloud compute addresses list --filter="name=$STATIC_IP_NAME" --format="value(name)" 2>$null
if ($existingIp) {
    Write-Info "عنوان IP الثابت موجود مسبقاً: $STATIC_IP_NAME"
} else {
    try {
        gcloud compute addresses create $STATIC_IP_NAME `
            --global `
             
        Write-Success "تم حجز عنوان IP ثابت عالمي: $STATIC_IP_NAME"
    } catch {
        Write-Err "فشل حجز عنوان IP الثابت"
        throw $_
    }
}

# الحصول على عنوان IP
$STATIC_IP = gcloud compute addresses describe $STATIC_IP_NAME --global --format="value(address)" 2>$null

# الحصول على عنوان Redis الداخلي
$REDIS_HOST = gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format="value(host)" 2>$null
$REDIS_PORT = gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format="value(port)" 2>$null

# الحصول على عنوان Cloud SQL الداخلي
$SQL_IP = gcloud sql instances describe $SQL_INSTANCE --format="value(ipAddresses[0].ipAddress)" 2>$null
$SQL_CONNECTION = gcloud sql instances describe $SQL_INSTANCE --format="value(connectionName)" 2>$null

# ──────────────────────────────────────────────────────────────
# الخطوة 13: عرض ملخص البنية التحتية
# ──────────────────────────────────────────────────────────────
Write-Step "13/13" "ملخص البنية التحتية المُنشأة"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "  ║          ✅ تم إعداد البنية التحتية بنجاح!                     ║" -ForegroundColor $Green
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""

Write-Host "  ┌──────────────────────────────────────────────────────────────────┐" -ForegroundColor $White
Write-Host "  │  📋 ملخص الموارد المُنشأة                                      │" -ForegroundColor $White
Write-Host "  ├──────────────────────────────────────────────────────────────────┤" -ForegroundColor $White
Write-Host "  │  🌐 شبكة VPC:          $VPC_NAME" -ForegroundColor $White
Write-Host "  │  ☸️  عنقود GKE:         $CLUSTER_NAME ($REGION)" -ForegroundColor $White
Write-Host "  │  🐘 Cloud SQL:          $SQL_INSTANCE (PostgreSQL 15)" -ForegroundColor $White
Write-Host "  │     اسم قاعدة البيانات: $DB_NAME" -ForegroundColor $White
Write-Host "  │     اتصال SQL:          $SQL_CONNECTION" -ForegroundColor $White
Write-Host "  │     عنوان SQL:           $SQL_IP" -ForegroundColor $White
Write-Host "  │  🔴 Redis:              $REDIS_INSTANCE ($REDIS_HOST`:$REDIS_PORT)" -ForegroundColor $White
Write-Host "  │  📦 Artifact Registry:  $REGISTRY_REPO ($REGION)" -ForegroundColor $White
Write-Host "  │  🪣 GCS Bucket:         gs://$GCS_BUCKET/" -ForegroundColor $White
Write-Host "  │  🔑 Service Account:    $SA_EMAIL" -ForegroundColor $White
Write-Host "  │  🌍 عنوان IP الثابت:   $STATIC_IP ($STATIC_IP_NAME)" -ForegroundColor $White
Write-Host "  └──────────────────────────────────────────────────────────────────┘" -ForegroundColor $White

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Yellow
Write-Host "  ║  ⚠️  تعليمات DNS المطلوبة                                      ║" -ForegroundColor $Yellow
Write-Host "  ╠══════════════════════════════════════════════════════════════════╣" -ForegroundColor $Yellow
Write-Host "  ║                                                                  ║" -ForegroundColor $Yellow
Write-Host "  ║  قم بإضافة سجلات DNS التالية عند مزود النطاق الخاص بك:         ║" -ForegroundColor $Yellow
Write-Host "  ║                                                                  ║" -ForegroundColor $Yellow
Write-Host "  ║  النوع   الاسم                    القيمة                        ║" -ForegroundColor $Yellow
Write-Host "  ║  ────── ─────────────────────── ──────────────────               ║" -ForegroundColor $Yellow
Write-Host "  ║  A       learnnov.org              $STATIC_IP" -ForegroundColor $White
Write-Host "  ║  A       studio.learnnov.org       $STATIC_IP" -ForegroundColor $White
Write-Host "  ║  A       api.learnnov.org          $STATIC_IP" -ForegroundColor $White
Write-Host "  ║                                                                  ║" -ForegroundColor $Yellow
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Yellow

Write-Host ""
Write-Host "  📌 الخطوة التالية:" -ForegroundColor $Cyan
Write-Host "     قم بتشغيل سكربت النشر: .\deploy-gke.ps1" -ForegroundColor $Cyan
Write-Host ""
Write-Host "  📌 معلومات الاتصال بقاعدة البيانات (محفوظة في Secret Manager):" -ForegroundColor $Cyan
Write-Host "     gcloud secrets versions access latest --secret=learnnov-db-password" -ForegroundColor $White
Write-Host ""
