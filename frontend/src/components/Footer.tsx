export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center px-8 py-8 mt-20 gap-4">
      <div className="flex flex-col gap-1 items-center md:items-start">
        <span className="font-bold text-slate-900 text-lg">LMS</span>
        <p className="text-xs text-slate-400">© 2024 LMS. All rights reserved.</p>
      </div>
      <div className="flex gap-8">
        <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Privacy Policy</a>
        <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Terms of Service</a>
        <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Help</a>
      </div>
    </footer>
  )
}
