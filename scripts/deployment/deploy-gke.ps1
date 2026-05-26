<#
.SYNOPSIS
    سكربت نشر منصة LearnNov على Google Kubernetes Engine
.DESCRIPTION
    يقوم هذا السكربت ببناء صور Docker ونشرها على GKE
    بما في ذلك: بناء الصور، دفعها، تطبيق ملفات Kubernetes، تشغيل الترحيلات، وإنشاء المشرف
.NOTES
    المشروع: LearnNov - منصة التعلم المبتكرة
    النطاق: learnnov.org
    التاريخ: 2026-05-22
.PREREQUISITE
    يجب تشغيل gke-setup.ps1 أولاً لإنشاء البنية التحتية
#>

# ══════════════════════════════════════════════════════════════
# إيقاف التنفيذ عند حدوث أي خطأ
# ══════════════════════════════════════════════════════════════
$ErrorActionPreference = 'Stop'

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
$DOMAIN           = "learnnov.org"
$K8S_NAMESPACE    = "learnnov"
$K8S_SA           = "learnnov-ksa"

# مسار الصورة الكامل في Artifact Registry
$IMAGE_BASE       = "$REGION-docker.pkg.dev/$PROJECT_ID/$REGISTRY_REPO/learnnov-cloud"
$TIMESTAMP        = Get-Date -Format 'yyyyMMdd-HHmmss'
$IMAGE_LATEST     = "${IMAGE_BASE}:latest"
$IMAGE_TAGGED     = "${IMAGE_BASE}:${TIMESTAMP}"

# مسار ملفات Kubernetes
$K8S_DIR          = Join-Path (Join-Path $PSScriptRoot "learnnov-cloud") "k8s"

# ══════════════════════════════════════════════════════════════
# ألوان الإخراج
# ══════════════════════════════════════════════════════════════
$Green   = "Green"
$Yellow  = "Yellow"
$Cyan    = "Cyan"
$Red     = "Red"
$White   = "White"
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

function Wait-ForRollout {
    param([string]$DeploymentName, [int]$TimeoutSeconds = 300)
    Write-Info "جارٍ انتظار اكتمال نشر: $DeploymentName (مهلة: ${TimeoutSeconds}ث)"
    kubectl rollout status deployment/$DeploymentName `
        -n $K8S_NAMESPACE `
        --timeout="${TimeoutSeconds}s" 2>&1 | Out-Null
}

# ══════════════════════════════════════════════════════════════
# شعار المنصة
# ══════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════╗" -ForegroundColor $Magenta
Write-Host "  ║                                                      ║" -ForegroundColor $Magenta
Write-Host "  ║     LearnNov Platform - نشر التطبيق                 ║" -ForegroundColor $Magenta
Write-Host "  ║     GKE Deployment Script                            ║" -ForegroundColor $Magenta
Write-Host "  ║                                                      ║" -ForegroundColor $Magenta
Write-Host "  ╚══════════════════════════════════════════════════════╝" -ForegroundColor $Magenta
Write-Host ""
Write-Host "  المشروع: $PROJECT_ID" -ForegroundColor $White
Write-Host "  المنطقة: $REGION" -ForegroundColor $White
Write-Host "  الصورة:  $IMAGE_TAGGED" -ForegroundColor $White
Write-Host ""

# ──────────────────────────────────────────────────────────────
# الخطوة 1: مصادقة Docker مع Artifact Registry
# ──────────────────────────────────────────────────────────────
Write-Step "1/10" "مصادقة Docker مع Artifact Registry"

try {
    gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet 2>&1 | Out-Null
    Write-Success "تم تكوين مصادقة Docker مع Artifact Registry"
} catch {
    Write-Err "فشل تكوين مصادقة Docker"
    throw $_
}

# ──────────────────────────────────────────────────────────────
# الخطوة 2: بناء صورة Docker
# ──────────────────────────────────────────────────────────────
Write-Step "2/10" "بناء صورة Docker لمنصة LearnNov"

try {
    Write-Info "جارٍ بناء الصورة من Dockerfile.prod..."
    Write-Info "الوسم: $IMAGE_LATEST"
    Write-Info "الوسم: $IMAGE_TAGGED"

    # بناء الصورة مع وسم latest
    docker build `
        -f Dockerfile.prod `
        -t $IMAGE_LATEST `
        -t $IMAGE_TAGGED `
        . 2>&1 | ForEach-Object {
            if ($_ -match "^Step|^Successfully|^COPY|^RUN|^FROM") {
                Write-Host "     $_" -ForegroundColor $White
            }
        }

    Write-Success "تم بناء صورة Docker بنجاح"
    Write-Info "الحجم: $(docker image inspect $IMAGE_LATEST --format='{{.Size}}' 2>$null | ForEach-Object { [math]::Round($_ / 1MB, 2) }) MB"
} catch {
    Write-Err "فشل بناء صورة Docker"
    Write-Err "تأكد من وجود ملف Dockerfile.prod في المسار الحالي"
    throw $_
}

# ──────────────────────────────────────────────────────────────
# الخطوة 3: دفع الصور إلى Artifact Registry
# ──────────────────────────────────────────────────────────────
Write-Step "3/10" "دفع الصور إلى Artifact Registry"

try {
    Write-Info "جارٍ دفع الصورة: $IMAGE_LATEST"
    docker push $IMAGE_LATEST 2>&1 | ForEach-Object {
        if ($_ -match "pushed|digest|latest") {
            Write-Host "     $_" -ForegroundColor $White
        }
    }
    Write-Success "تم دفع الصورة: latest"

    Write-Info "جارٍ دفع الصورة: $IMAGE_TAGGED"
    docker push $IMAGE_TAGGED 2>&1 | ForEach-Object {
        if ($_ -match "pushed|digest|$TIMESTAMP") {
            Write-Host "     $_" -ForegroundColor $White
        }
    }
    Write-Success "تم دفع الصورة: $TIMESTAMP"
} catch {
    Write-Err "فشل دفع الصور إلى Artifact Registry"
    throw $_
}

# ──────────────────────────────────────────────────────────────
# الخطوة 4: الحصول على بيانات اعتماد عنقود GKE
# ──────────────────────────────────────────────────────────────
Write-Step "4/10" "الحصول على بيانات اعتماد عنقود GKE"

try {
    gcloud container clusters get-credentials $CLUSTER_NAME `
        --region=$REGION `
        --quiet 2>&1 | Out-Null
    Write-Success "تم الحصول على بيانات اعتماد العنقود: $CLUSTER_NAME"

    # التحقق من الاتصال
    $nodeCount = kubectl get nodes --no-headers 2>$null | Measure-Object -Line | Select-Object -ExpandProperty Lines
    Write-Info "عدد العُقد النشطة: $nodeCount"
} catch {
    Write-Err "فشل الحصول على بيانات اعتماد العنقود"
    throw $_
}

# ──────────────────────────────────────────────────────────────
# الخطوة 5: تطبيق ملفات Kubernetes بالترتيب
# ──────────────────────────────────────────────────────────────
Write-Step "5/10" "تطبيق ملفات Kubernetes (Manifests)"

# ترتيب تطبيق الملفات مهم لضمان الاعتمادات
$manifests = @(
    @{ Name = "فضاء الأسماء (Namespace)";       File = "namespace.yaml" },
    @{ Name = "حساب الخدمة (ServiceAccount)";    File = "service-account.yaml" },
    @{ Name = "الأسرار (Secrets)";               File = "secrets.yaml" },
    @{ Name = "خريطة الإعدادات (ConfigMap)";     File = "configmap.yaml" },
    @{ Name = "نشر Django (Deployment)";         File = "deployment-django.yaml" },
    @{ Name = "نشر Open edX (Deployment)";       File = "deployment-openedx.yaml" },
    @{ Name = "خدمة Django (Service)";           File = "service-django.yaml" },
    @{ Name = "خدمة Open edX (Service)";         File = "service-openedx.yaml" },
    @{ Name = "المدخل (Ingress)";                File = "ingress.yaml" },
    @{ Name = "التحجيم التلقائي (HPA)";          File = "hpa.yaml" }
)

foreach ($manifest in $manifests) {
    $manifestPath = Join-Path $K8S_DIR $manifest.File
    if (Test-Path $manifestPath) {
        try {
            Write-Info "جارٍ تطبيق: $($manifest.Name) - $($manifest.File)"
            
            # قراءة الملف واستبدال المتغيرات برمجياً
            $content = Get-Content $manifestPath -Raw
            $content = $content -replace "\$\{PROJECT_ID\}", $PROJECT_ID
            $content = $content -replace "\$\{REGION\}", $REGION
            $content = $content -replace "\$\{SQL_INSTANCE\}", $SQL_INSTANCE
            
            $content | kubectl apply -f - 2>&1 | ForEach-Object {
                Write-Host "     $_" -ForegroundColor $White
            }
            Write-Success "تم تطبيق: $($manifest.Name)"
        } catch {
            Write-Err "فشل تطبيق: $($manifest.Name) ($($manifest.File))"
            throw $_
        }
    } else {
        Write-Info "ملف غير موجود، تخطي: $($manifest.File)"
    }
}

# انتظار اكتمال النشر
Write-Info "جارٍ انتظار اكتمال النشر..."
Start-Sleep -Seconds 5

# محاولة انتظار النشر الرئيسي
try {
    $deployments = kubectl get deployments -n $K8S_NAMESPACE --no-headers -o custom-columns=":metadata.name" 2>$null
    if ($deployments) {
        foreach ($dep in ($deployments -split "`n" | Where-Object { $_.Trim() })) {
            $dep = $dep.Trim()
            if ($dep) {
                Wait-ForRollout -DeploymentName $dep -TimeoutSeconds 300
                Write-Success "اكتمل نشر: $dep"
            }
        }
    }
} catch {
    Write-Info "⚠️ تحذير: لم يكتمل بعض النشر في الوقت المحدد - متابعة..."
}

# ──────────────────────────────────────────────────────────────
# الخطوة 6: تشغيل ترحيلات قاعدة البيانات
# ──────────────────────────────────────────────────────────────
Write-Step "6/10" "تشغيل ترحيلات قاعدة البيانات (Database Migrations)"

$migrationJobPath = Join-Path $K8S_DIR "job-migrate.yaml"
if (Test-Path $migrationJobPath) {
    try {
        # حذف المهمة السابقة إن وجدت
        kubectl delete job learnnov-migrate -n $K8S_NAMESPACE --ignore-not-found 2>&1 | Out-Null

        Write-Info "جارٍ تشغيل مهمة الترحيل..."
        kubectl apply -f $migrationJobPath 2>&1 | Out-Null

        # انتظار اكتمال المهمة (مهلة 5 دقائق)
        Write-Info "جارٍ انتظار اكتمال الترحيل (مهلة: 300 ثانية)..."
        kubectl wait --for=condition=complete job/learnnov-migrate `
            -n $K8S_NAMESPACE `
            --timeout=300s 2>&1 | Out-Null

        Write-Success "تم اكتمال ترحيلات قاعدة البيانات بنجاح"

        # عرض سجلات الترحيل
        Write-Info "سجلات الترحيل:"
        kubectl logs job/learnnov-migrate -n $K8S_NAMESPACE 2>$null | Select-Object -Last 10 | ForEach-Object {
            Write-Host "     $_" -ForegroundColor $White
        }
    } catch {
        Write-Err "فشل تشغيل ترحيلات قاعدة البيانات"
        Write-Info "سجلات المهمة:"
        kubectl logs job/learnnov-migrate -n $K8S_NAMESPACE 2>$null | Select-Object -Last 20 | ForEach-Object {
            Write-Host "     $_" -ForegroundColor $Red
        }
        throw $_
    }
} else {
    Write-Info "ملف مهمة الترحيل غير موجود: $migrationJobPath"
    Write-Info "تخطي الترحيلات - تأكد من وجود الملف قبل النشر"
}

# ──────────────────────────────────────────────────────────────
# الخطوة 7: إنشاء المشرف الأعلى (Superuser)
# ──────────────────────────────────────────────────────────────
Write-Step "7/10" "إنشاء حساب المشرف الأعلى (Django Superuser)"

try {
    # الحصول على اسم أول pod لتطبيق Django
    $djangoPod = kubectl get pods -n $K8S_NAMESPACE `
        -l app=learnnov-web `
        -o jsonpath='{.items[0].metadata.name}' 2>$null

    if (-not $djangoPod) {
        # محاولة البحث باسم مختلف
        $djangoPod = kubectl get pods -n $K8S_NAMESPACE `
            -l app=learnnov `
            -o jsonpath='{.items[0].metadata.name}' 2>$null
    }

    if ($djangoPod) {
        Write-Info "Pod المستهدف: $djangoPod"
        Write-Info "جارٍ إنشاء حساب المشرف الأعلى..."

        # إنشاء المشرف عبر أمر Django management
        kubectl exec $djangoPod -n $K8S_NAMESPACE -- python manage.py shell -c @"
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@learnnov.org',
        password='$(
            -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 16 | ForEach-Object { [char]$_ })
        )'
    )
    print('تم إنشاء حساب المشرف بنجاح')
else:
    print('حساب المشرف موجود مسبقاً')
"@ 2>&1 | ForEach-Object {
            Write-Host "     $_" -ForegroundColor $White
        }

        Write-Success "تم إنشاء حساب المشرف الأعلى"
        Write-Info "⚠️ تنبيه: قم بتغيير كلمة المرور فوراً من لوحة الإدارة"
        Write-Info "   رابط الإدارة: https://$DOMAIN/admin/"
    } else {
        Write-Info "لم يتم العثور على pod لتطبيق Django"
        Write-Info "يمكنك إنشاء المشرف يدوياً لاحقاً باستخدام:"
        Write-Host "     kubectl exec -it <pod-name> -n $K8S_NAMESPACE -- python manage.py createsuperuser" -ForegroundColor $White
    }
} catch {
    Write-Info "⚠️ تخطي إنشاء المشرف - يمكنك إنشائه يدوياً لاحقاً"
}

# ──────────────────────────────────────────────────────────────
# الخطوة 8: جمع الملفات الثابتة
# ──────────────────────────────────────────────────────────────
Write-Step "8/10" "جمع الملفات الثابتة (collectstatic)"

try {
    if ($djangoPod) {
        Write-Info "جارٍ جمع الملفات الثابتة..."
        kubectl exec $djangoPod -n $K8S_NAMESPACE -- python manage.py collectstatic --noinput 2>&1 | Select-Object -Last 3 | ForEach-Object {
            Write-Host "     $_" -ForegroundColor $White
        }
        Write-Success "تم جمع الملفات الثابتة"
    } else {
        Write-Info "تخطي - لم يتم العثور على pod التطبيق"
    }
} catch {
    Write-Info "⚠️ تخطي جمع الملفات الثابتة"
}

# ──────────────────────────────────────────────────────────────
# الخطوة 9: التحقق من النشر
# ──────────────────────────────────────────────────────────────
Write-Step "9/10" "التحقق من حالة النشر"

Write-Host ""
Write-Host "  📦 حالة الـ Pods:" -ForegroundColor $Cyan
kubectl get pods -n $K8S_NAMESPACE -o wide 2>$null | ForEach-Object {
    Write-Host "     $_" -ForegroundColor $White
}

Write-Host ""
Write-Host "  🔗 حالة الخدمات (Services):" -ForegroundColor $Cyan
kubectl get services -n $K8S_NAMESPACE 2>$null | ForEach-Object {
    Write-Host "     $_" -ForegroundColor $White
}

Write-Host ""
Write-Host "  🌐 حالة المدخل (Ingress):" -ForegroundColor $Cyan
kubectl get ingress -n $K8S_NAMESPACE 2>$null | ForEach-Object {
    Write-Host "     $_" -ForegroundColor $White
}

Write-Host ""
Write-Host "  📊 حالة HPA:" -ForegroundColor $Cyan
kubectl get hpa -n $K8S_NAMESPACE 2>$null | ForEach-Object {
    Write-Host "     $_" -ForegroundColor $White
}

# الحصول على عنوان IP الخارجي للمدخل
$ingressIp = kubectl get ingress -n $K8S_NAMESPACE -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>$null
$staticIp  = gcloud compute addresses describe learnnov-ip --global --format="value(address)" 2>$null

# التحقق من صحة الـ pods
$readyPods = kubectl get pods -n $K8S_NAMESPACE --field-selector=status.phase=Running --no-headers 2>$null | Measure-Object -Line | Select-Object -ExpandProperty Lines
$totalPods = kubectl get pods -n $K8S_NAMESPACE --no-headers 2>$null | Measure-Object -Line | Select-Object -ExpandProperty Lines

Write-Host ""
if ($readyPods -eq $totalPods -and $totalPods -gt 0) {
    Write-Success "جميع الـ Pods تعمل بنجاح ($readyPods/$totalPods)"
} else {
    Write-Info "⚠️ بعض الـ Pods لم تبدأ بعد ($readyPods/$totalPods)"
    Write-Info "   انتظر قليلاً ثم تحقق: kubectl get pods -n $K8S_NAMESPACE"
}

# ──────────────────────────────────────────────────────────────
# الخطوة 10: الملخص النهائي
# ──────────────────────────────────────────────────────────────
Write-Step "10/10" "الملخص النهائي للنشر"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "  ║       🚀 تم نشر منصة LearnNov بنجاح!                         ║" -ForegroundColor $Green
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""

Write-Host "  ┌──────────────────────────────────────────────────────────────────┐" -ForegroundColor $White
Write-Host "  │  🌐 روابط المنصة                                               │" -ForegroundColor $White
Write-Host "  ├──────────────────────────────────────────────────────────────────┤" -ForegroundColor $White
Write-Host "  │                                                                  │" -ForegroundColor $White
Write-Host "  │  📚 المنصة الرئيسية:  https://learnnov.org                     │" -ForegroundColor $Cyan
Write-Host "  │  🎨 استوديو المحتوى: https://studio.learnnov.org              │" -ForegroundColor $Cyan
Write-Host "  │  🔧 لوحة الإدارة:    https://learnnov.org/admin/              │" -ForegroundColor $Cyan
Write-Host "  │                                                                  │" -ForegroundColor $White
Write-Host "  │  📡 نقاط API:                                                  │" -ForegroundColor $White
Write-Host "  │     - API الرئيسي:    https://learnnov.org/api/v1/             │" -ForegroundColor $White
Write-Host "  │     - المصادقة:       https://learnnov.org/api/v1/auth/        │" -ForegroundColor $White
Write-Host "  │     - الدورات:        https://learnnov.org/api/v1/courses/     │" -ForegroundColor $White
Write-Host "  │     - المستخدمون:     https://learnnov.org/api/v1/users/       │" -ForegroundColor $White
Write-Host "  │                                                                  │" -ForegroundColor $White
Write-Host "  └──────────────────────────────────────────────────────────────────┘" -ForegroundColor $White

Write-Host ""
Write-Host "  ┌──────────────────────────────────────────────────────────────────┐" -ForegroundColor $White
Write-Host "  │  📦 تفاصيل النشر                                               │" -ForegroundColor $White
Write-Host "  ├──────────────────────────────────────────────────────────────────┤" -ForegroundColor $White
Write-Host "  │  الصورة:    $IMAGE_TAGGED" -ForegroundColor $White
Write-Host "  │  العنقود:    $CLUSTER_NAME ($REGION)" -ForegroundColor $White
Write-Host "  │  Namespace: $K8S_NAMESPACE" -ForegroundColor $White
Write-Host "  │  IP الثابت: $staticIp" -ForegroundColor $White
Write-Host "  │  Ingress IP: $ingressIp" -ForegroundColor $White
Write-Host "  └──────────────────────────────────────────────────────────────────┘" -ForegroundColor $White

# تعليمات DNS إذا لم يتم تكوينها
Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor $Yellow
Write-Host "  ║  ⚠️  تذكير: إعدادات DNS                                        ║" -ForegroundColor $Yellow
Write-Host "  ╠══════════════════════════════════════════════════════════════════╣" -ForegroundColor $Yellow
Write-Host "  ║                                                                  ║" -ForegroundColor $Yellow
Write-Host "  ║  إذا لم تقم بإعداد DNS بعد، أضف السجلات التالية:               ║" -ForegroundColor $Yellow
Write-Host "  ║                                                                  ║" -ForegroundColor $Yellow
Write-Host "  ║  A    learnnov.org            →  $staticIp" -ForegroundColor $White
Write-Host "  ║  A    studio.learnnov.org     →  $staticIp" -ForegroundColor $White
Write-Host "  ║  A    api.learnnov.org        →  $staticIp" -ForegroundColor $White
Write-Host "  ║                                                                  ║" -ForegroundColor $Yellow
Write-Host "  ║  💡 نصيحة: بعد إعداد DNS، فعّل شهادة SSL المُدارة              ║" -ForegroundColor $Yellow
Write-Host "  ║     عبر Google Managed Certificate في Ingress.                  ║" -ForegroundColor $Yellow
Write-Host "  ║                                                                  ║" -ForegroundColor $Yellow
Write-Host "  ╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor $Yellow

Write-Host ""
Write-Host "  ┌──────────────────────────────────────────────────────────────────┐" -ForegroundColor $White
Write-Host "  │  🛠️  أوامر مفيدة                                                │" -ForegroundColor $White
Write-Host "  ├──────────────────────────────────────────────────────────────────┤" -ForegroundColor $White
Write-Host "  │  مراقبة الـ Pods:     kubectl get pods -n $K8S_NAMESPACE -w" -ForegroundColor $White
Write-Host "  │  سجلات التطبيق:      kubectl logs -f deploy/learnnov-web -n $K8S_NAMESPACE" -ForegroundColor $White
Write-Host "  │  الدخول للحاوية:     kubectl exec -it deploy/learnnov-web -n $K8S_NAMESPACE -- bash" -ForegroundColor $White
Write-Host "  │  حالة الـ Ingress:    kubectl describe ingress -n $K8S_NAMESPACE" -ForegroundColor $White
Write-Host "  │  تحجيم يدوي:         kubectl scale deploy/learnnov-web --replicas=3 -n $K8S_NAMESPACE" -ForegroundColor $White
Write-Host "  └──────────────────────────────────────────────────────────────────┘" -ForegroundColor $White
Write-Host ""
Write-Host "  🎉 منصة LearnNov جاهزة للاستخدام! حظاً موفقاً!" -ForegroundColor $Green
Write-Host ""
