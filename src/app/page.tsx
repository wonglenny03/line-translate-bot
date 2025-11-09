export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="text-4xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Line 翻译机器人
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            这是一个基于 Next.js 和 Line Messaging API 的多语言翻译机器人。
          </p>
          <div className="mt-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-6 text-left">
            <h2 className="mb-4 text-xl font-semibold text-black dark:text-zinc-50">
              功能特性
            </h2>
            <ul className="space-y-2 text-zinc-700 dark:text-zinc-300">
              <li>• 支持9种语言翻译</li>
              <li>• 用户加入时自动弹出语言选择</li>
              <li>• 保存用户语言偏好</li>
              <li>• 使用 Google 翻译 API</li>
            </ul>
          </div>
          <div className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Webhook 端点:{" "}
            <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-2 py-1">
              /api/line/webhook
            </code>
          </div>
        </div>
      </main>
    </div>
  )
}
