import { Link } from "react-router-dom";
import { Instagram, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
    return (
        <footer className="bg-walnut text-ivory pt-20 pb-10 border-t border-gold/20">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center text-walnut font-serif font-bold text-xl">
                                e
                            </div>
                            <span className="text-3xl font-serif font-bold tracking-tight text-gold">estre</span>
                        </div>
                        <p className="text-ivory/80 leading-relaxed max-w-xs font-light">
                            Crafting exceptional furniture experiences.
                            Premium, minimal, and bespoke designs for your sanctuary.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-gold font-serif font-bold text-lg mb-6">Explore</h4>
                        <ul className="space-y-3">
                            <li><Link to="/products" className="text-ivory/80 hover:text-gold transition-colors">All Products</Link></li>
                            <li><Link to="/products?category=sofa" className="text-ivory/80 hover:text-gold transition-colors">Sofas</Link></li>
                            <li><Link to="/products?category=bed" className="text-ivory/80 hover:text-gold transition-colors">Beds</Link></li>
                            <li><Link to="/products?category=recliner" className="text-ivory/80 hover:text-gold transition-colors">Recliners</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-gold font-serif font-bold text-lg mb-6">Contact</h4>
                        <ul className="space-y-4 text-ivory/80">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gold shrink-0 mt-1" />
                                <span>Near Dhoni Public School<br />AECS Layout-A Block<br />Bengaluru - 560 068</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-gold shrink-0" />
                                <a href="tel:+918722200100" className="hover:text-gold transition-colors">+91 87 22 200 100</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-gold shrink-0" />
                                <a href="mailto:support@estre.in" className="hover:text-gold transition-colors">support@estre.in</a>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-gold font-serif font-bold text-lg mb-6">Stay Connected</h4>
                        <div className="flex gap-4 mb-8">
                            <a href="https://instagram.com/estre" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-gold/30 hover:bg-gold hover:text-walnut transition-all">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://wa.me/918722200100" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full border border-gold/30 hover:bg-gold hover:text-walnut transition-all">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-ivory/60">Subscribe to our newsletter</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Email address"
                                    className="bg-white/5 border border-gold/20 rounded-lg px-4 py-2 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold w-full"
                                />
                                <Button className="bg-gold text-walnut hover:bg-white hover:text-walnut">
                                    Join
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gold/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-ivory/50">
                    <p>&copy; 2024 Estre Global Private Limited.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
