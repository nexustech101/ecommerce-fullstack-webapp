export function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-stone-800 py-16 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-2xl tracking-[0.2em] text-amber-100 uppercase mb-4">
              Maison
            </h3>
            <p className="text-stone-500 text-sm leading-relaxed max-w-xs">
              Curated goods for the considered life. Objects that earn their place in your world.
            </p>
          </div>
          <div>
            <h4 className="text-xs tracking-widest uppercase text-stone-400 mb-4">Navigate</h4>
            <ul className="space-y-2">
              {["Shop All", "Subscriptions", "About", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-stone-500 hover:text-amber-100 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs tracking-widest uppercase text-stone-400 mb-4">Policies</h4>
            <ul className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Returns", "Shipping"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-stone-500 hover:text-amber-100 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-stone-800 text-center">
          <p className="text-xs text-stone-600 tracking-widest uppercase">
            © {new Date().getFullYear()} Maison. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}