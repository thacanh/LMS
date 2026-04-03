export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center px-8 py-8 mt-20 gap-4">
      <div className="flex flex-col gap-1 items-center md:items-start">
        <span className="font-bold text-slate-900 text-lg">Academic Curator LMS</span>
        <p className="text-xs text-slate-400">© 2024 Academic Curator LMS. Bảo lưu mọi quyền.</p>
      </div>
      <div className="flex gap-8">
        <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Chính sách bảo mật</a>
        <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Điều khoản dịch vụ</a>
        <a className="text-xs text-slate-400 hover:text-primary transition-colors" href="#">Trợ giúp</a>
      </div>
    </footer>
  )
}
