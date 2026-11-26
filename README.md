# FormCraft AI (Next.js)

محرر الاستمارات والامتحانات في `public/formcraft.html`، ومسار الذكاء الاصطناعي في `app/api/ai/route.ts` (المفتاح على الخادم فقط).

## التشغيل محليًا
    npm install
    cp .env.example .env.local   # ضع ANTHROPIC_API_KEY
    npm run dev                  # http://localhost:3000

## النشر على Vercel
1. ارفع المشروع على GitHub (لا ترفع .env.local).
2. من vercel.com اختر Add New > Project واستورد المستودع (Framework: Next.js تلقائيًا).
3. في Environment Variables أضف ANTHROPIC_API_KEY (واختياريًا ANTHROPIC_MODEL).
4. اضغط Deploy. بعدها اربط دومين الشركة من Settings > Domains.

## حدود هذه النسخة
المستندات تُحفظ في متصفح المستخدم (localStorage). لا يوجد تسجيل دخول ولا قاعدة بيانات.
مسار الذكاء الاصطناعي مفتوح للعامة؛ فيه حد 10 طلبات في الدقيقة لكل IP، وللحماية الكاملة أضف تسجيل دخول.
