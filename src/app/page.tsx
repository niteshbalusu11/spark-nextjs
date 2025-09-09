import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
          <h1 className="text-3xl font-bold text-center">
            Spark Wallet Integration
          </h1>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
            A complete implementation of the Spark Wallet SDK with Lightning Network support,
            Bitcoin deposits, token management, and Universal Money Address (UMA) integration.
          </p>
          
          <div className="flex gap-3 flex-col sm:flex-row">
            <Link
              href="/wallet"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 hover:bg-blue-700 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Open Spark Wallet
            </Link>
            
            <Link
              href="/uma"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-purple-600 text-white gap-2 hover:bg-purple-700 text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Open UMA Wallet
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-2">⚡ Lightning Network</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create and pay Lightning invoices instantly with low fees
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-2">💰 Bitcoin Deposits</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Generate deposit addresses and claim Bitcoin deposits
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-2">📤 Transfers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Send Bitcoin to other Spark addresses seamlessly
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-2">🌐 UMA Integration</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Universal Money Address for global Lightning payments
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-2">💱 Multi-Currency</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support for USD, BTC, and automatic currency conversion
            </p>
          </div>
          
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold mb-2">🔐 Secure</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Non-custodial wallet with full control of your keys
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://docs.spark.money"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read Spark docs
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://github.com/buildonspark"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p className="text-sm text-gray-500">
          Built with Next.js and Spark Wallet SDK
        </p>
      </footer>
    </div>
  );
}
