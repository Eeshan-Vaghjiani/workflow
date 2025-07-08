import React, { useEffect, useState, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, useAnimation, useInView } from 'framer-motion';
import axios from 'axios';

// Animations variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 }
    }
};

const rotateIn = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.8, delay: 0.3 }
    }
};

// Feature card props type
interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    delay?: number;
}

// Feature card component
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <motion.div
            ref={ref}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.2 }
            }}
        >
            <div className="bg-[#D3E3FC] dark:bg-[#1e3a60] rounded-full w-14 h-14 flex items-center justify-center mb-4 transform transition-transform group-hover:scale-110">
                <span className="text-[#00887A] dark:text-[#00ccb4] text-2xl">{icon}</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </motion.div>
    );
};

// Pricing plan props type
interface PricingPlanProps {
    title: string;
    price: string;
    description: string;
    features: string[];
    ctaText: string;
    ctaLink: string;
    highlighted?: boolean;
    delay?: number;
}

// Pricing plan component
const PricingPlan: React.FC<PricingPlanProps> = ({
    title,
    price,
    description,
    features,
    ctaText,
    ctaLink,
    highlighted = false,
    delay = 0
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col ${highlighted
                ? 'border-2 border-[#00887A] dark:border-[#00ccb4] shadow-xl transform scale-105 relative'
                : 'border border-gray-200 dark:border-gray-700'
                }`}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{
                y: -5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.2 }
            }}
        >
            {highlighted && (
                <div className="absolute -top-3 left-0 right-0 mx-auto w-fit px-4 py-1 bg-[#00887A] dark:bg-[#00ccb4] text-white text-sm font-medium rounded-full">
                    Most Popular
                </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <div className="text-3xl font-bold mb-2 text-[#00887A] dark:text-[#00ccb4]">{price}</div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
            <div className="flex-1">
                <ul className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                            <div className="mr-2 mt-1">
                                <svg className="h-5 w-5 text-[#00887A] dark:text-[#00ccb4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <Link href={ctaLink} className={`text-center py-2 px-4 w-full rounded-lg transition-colors ${highlighted
                ? 'bg-[#00887A] hover:bg-[#007A6C] text-white'
                : 'bg-[#D3E3FC] dark:bg-[#1e3a60] hover:bg-[#b3d0fb] dark:hover:bg-[#2a4d7d] text-gray-800 dark:text-gray-200'
                }`}>
                {ctaText}
            </Link>
        </motion.div>
    );
};

const HomePage = () => {
    // References for sections
    const featuresRef = useRef<HTMLElement>(null);
    const pricingRef = useRef<HTMLElement>(null);
    const contactRef = useRef<HTMLElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const mockupRef = useRef<HTMLDivElement>(null);

    // Mouse position state for cursor effect
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [cursorHover, setCursorHover] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Controls for animations
    const controls = useAnimation();

    // Check authentication status on page load
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Try the primary authentication status endpoint
                const response = await axios.get('/auth/status');
                const data = response.data;

                if (data.authenticated && data.user) {
                    setIsAuthenticated(true);
                    // Ensure is_admin is properly cast to boolean
                    const isAdminUser = data.user.is_admin === 1 || data.user.is_admin === true;
                    setIsAdmin(isAdminUser);
                    console.log('Auth status:', {
                        authenticated: true,
                        is_admin_raw: data.user.is_admin,
                        is_admin_cast: isAdminUser
                    });
                } else {
                    setIsAuthenticated(false);
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error('Error checking auth status:', error);

                // Fallback to another endpoint if the first one fails
                try {
                    const fallbackResponse = await axios.get('/api/auth-quick');
                    const fallbackData = fallbackResponse.data;

                    if (fallbackData.authenticated && fallbackData.user) {
                        setIsAuthenticated(true);
                        // Ensure is_admin is properly cast to boolean
                        const isAdminUser = fallbackData.user.is_admin === 1 || fallbackData.user.is_admin === true;
                        setIsAdmin(isAdminUser);
                        console.log('Fallback auth status:', {
                            authenticated: true,
                            is_admin_raw: fallbackData.user.is_admin,
                            is_admin_cast: isAdminUser
                        });
                    } else {
                        setIsAuthenticated(false);
                        setIsAdmin(false);
                    }
                } catch (fallbackError) {
                    console.error('Fallback auth check failed:', fallbackError);
                    setIsAuthenticated(false);
                    setIsAdmin(false);
                }
            }
        };

        checkAuth();
    }, []);

    // Scroll to section function
    const scrollToSection = (elementRef: React.RefObject<HTMLElement>) => {
        elementRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Mouse move handler
    const handleMouseMove = (e: React.MouseEvent) => {
        if (mockupRef.current) {
            const rect = mockupRef.current.getBoundingClientRect();
            setMousePosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        controls.start('visible');
    }, [controls]);

    // Contact form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [formStatus, setFormStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({
        type: null,
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleContactSubmit = async () => {
        setIsSubmitting(true);
        setFormStatus({ type: null, message: '' });

        try {
            // Get CSRF token
            await axios.get('/csrf-refresh');

            // Submit the form
            const response = await axios.post('/api/contact', formData);

            setFormStatus({
                type: 'success',
                message: response.data.message || 'Thank you for your message! We will be in touch soon.'
            });

            // Clear the form
            setFormData({
                name: '',
                email: '',
                message: ''
            });
        } catch (error) {
            setFormStatus({
                type: 'error',
                message: 'There was a problem sending your message. Please try again.'
            });
            console.error('Contact form error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <header className="fixed w-full top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
                    <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Workflow
                                </Link>
                            </div>

                            {/* Navigation Links - Desktop */}
                            <div className="hidden md:flex items-center space-x-8">
                                <button onClick={() => scrollToSection(featuresRef)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                    Features
                                </button>
                                <button onClick={() => scrollToSection(pricingRef)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                    Pricing
                                </button>
                                <button onClick={() => scrollToSection(contactRef)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                    Contact
                                </button>
                                {isAuthenticated ? (
                                    <Link
                                        href={isAdmin ? "/admin/dashboard" : "/dashboard"}
                                        className="bg-[#00887A] hover:bg-[#007A6C] text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        {isAdmin ? "Admin Dashboard" : "Dashboard"}
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="bg-[#00887A] hover:bg-[#007A6C] text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>

                            {/* Mobile menu */}
                            <div className="md:hidden flex items-center">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                ref={heroRef}
                                initial="hidden"
                                animate={controls}
                                variants={fadeIn}
                                className="space-y-6"
                            >
                                <motion.span
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="inline-block px-4 py-2 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] text-[#00887A] dark:text-[#00ccb4] font-medium text-sm"
                                >
                                    AI-Powered Academic Workflow Platform
                                </motion.span>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, delay: 0.1 }}
                                    className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
                                >
                                    Streamline Your <span className="text-[#00887A] dark:text-[#00ccb4]">Academic</span> Collaboration
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, delay: 0.2 }}
                                    className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl"
                                >
                                    Manage group projects, generate AI-assisted task assignments, and collaborate seamlessly with real-time chat and integrated study tools.
                                </motion.p>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.7, delay: 0.3 }}
                                    className="flex flex-col sm:flex-row gap-4 pt-4"
                                >
                                    <Link
                                        href={route('register')}
                                        className="bg-[#00887A] text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-[#007A6C] transition transform hover:scale-105 shadow-lg"
                                    >
                                        Try it Free
                                    </Link>
                                    <button
                                        onClick={() => scrollToSection(featuresRef)}
                                        className="bg-[#FFCCBC] dark:bg-[#FF9E80] text-gray-900 px-6 py-3 rounded-md text-lg font-medium hover:bg-[#FFB8A1] dark:hover:bg-[#FFB29B] transition transform hover:scale-105 shadow-lg"
                                    >
                                        Learn More
                                    </button>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.7, delay: 0.4 }}
                                    className="flex items-center gap-4 pt-6"
                                >
                                    <div className="flex -space-x-2">
                                        {[1, 2,].map((i) => (
                                            <div
                                                key={i}
                                                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center text-xs font-medium"
                                            >
                                                {['JD', 'AK'][i - 1]}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Join <b>25+</b> students already using WorkFlow</span>
                                </motion.div>
                            </motion.div>

                            <motion.div
                                ref={mockupRef}
                                animate={controls}
                                initial="hidden"
                                variants={rotateIn}
                                whileHover={{
                                    scale: 1.03,
                                    rotateY: 5,
                                    transition: { duration: 0.3 }
                                }}
                                onMouseMove={handleMouseMove}
                                onMouseEnter={() => setCursorHover(true)}
                                onMouseLeave={() => setCursorHover(false)}
                                className="relative rounded-xl overflow-hidden shadow-2xl lg:h-[480px] perspective-1000 cursor-pointer"
                                style={{
                                    transformStyle: 'preserve-3d',
                                }}
                            >
                                {/* Dynamic cursor gradient overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none z-20 opacity-80 transition-opacity duration-300"
                                    style={{
                                        background: cursorHover ?
                                            `radial-gradient(circle 150px at ${mousePosition.x}px ${mousePosition.y}px,
                                            rgba(0, 136, 122, 0.15) 0%,
                                            rgba(0, 136, 122, 0) 60%)` :
                                            'none',
                                    }}
                                />

                                <div className="absolute inset-0 pointer-events-none z-20 opacity-60 dark:opacity-80 transition-opacity duration-300"
                                    style={{
                                        background: cursorHover ?
                                            `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px,
                                            rgba(119, 166, 247, 0.2) 0%,
                                            rgba(119, 166, 247, 0) 70%)` :
                                            'none',
                                    }}
                                />

                                {/* Static styling elements */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#77A6F7]/30 to-[#00887A]/20 dark:from-[#77A6F7]/20 dark:to-[#00887A]/10 mix-blend-overlay z-10 rounded-xl"></div>
                                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#FFCCBC] dark:bg-[#FF9E80] rounded-full opacity-60 blur-xl"></div>
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#77A6F7] dark:bg-[#4876BF] rounded-full opacity-40 blur-xl"></div>

                                {/* Edge highlight effect that follows cursor */}
                                <div
                                    className="absolute inset-0 border-2 border-white/20 dark:border-white/10 z-10 rounded-lg pointer-events-none"
                                    style={{
                                        boxShadow: cursorHover ?
                                            `0 0 25px 3px rgba(0, 136, 122, 0.3),
                                            inset 0 0 15px 3px rgba(119, 166, 247, 0.2)` :
                                            'none',
                                        transition: 'box-shadow 0.3s ease-out'
                                    }}
                                ></div>

                                <div className="relative z-20 p-2 h-full">
                                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-inner h-full flex flex-col overflow-hidden border border-gray-100 dark:border-gray-700">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-3 flex items-center border-b border-gray-200 dark:border-gray-600">
                                            <div className="flex space-x-1">
                                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                            </div>
                                            <div className="mx-auto text-xs font-medium text-gray-500 dark:text-gray-400">Academic Workflow Dashboard</div>
                                        </div>
                                        <div className="flex-1 p-4 overflow-hidden">
                                            <div className="grid grid-cols-2 gap-4 h-full">
                                                <div className="flex flex-col gap-4">
                                                    <div className="bg-[#D3E3FC]/50 dark:bg-[#1e3a60]/50 rounded-lg p-4 flex-1">
                                                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1 text-gray-900 dark:text-gray-100">
                                                            <span className="inline-block w-3 h-3 bg-[#00887A] dark:bg-[#00ccb4] rounded-full"></span>
                                                            Upcoming Tasks
                                                        </h4>
                                                        <ul className="space-y-2">
                                                            {['Research Paper Draft', 'Group Project Milestone', 'Presentation Slides'].map((task, i) => (
                                                                <li key={i} className="flex items-center gap-2">
                                                                    <div className="w-4 h-4 border border-gray-300 dark:border-gray-600 rounded flex-shrink-0"></div>
                                                                    <span className="text-xs truncate text-gray-700 dark:text-gray-300">{task}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="bg-[#FFCCBC]/30 dark:bg-[#FF9E80]/20 rounded-lg p-4 flex-1">
                                                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1 text-gray-900 dark:text-gray-100">
                                                            <span className="inline-block w-3 h-3 bg-[#FFCCBC] dark:bg-[#FF9E80] rounded-full"></span>
                                                            AI Assistant
                                                        </h4>
                                                        <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded p-2">
                                                            <div className="w-6 h-6 bg-[#77A6F7] dark:bg-[#4876BF] rounded-full flex-shrink-0"></div>
                                                            <div className="text-xs text-gray-700 dark:text-gray-300">Generating tasks for your project...</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-[#77A6F7]/20 dark:bg-[#4876BF]/20 rounded-lg p-4">
                                                    <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">Group Progress</h4>
                                                    <div className="space-y-3 mt-4">
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1 text-gray-700 dark:text-gray-300">
                                                                <span>Research</span>
                                                                <span>75%</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                                                <div className="h-2 bg-[#00887A] dark:bg-[#00ccb4] rounded-full" style={{ width: '75%' }}></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1 text-gray-700 dark:text-gray-300">
                                                                <span>Writing</span>
                                                                <span>45%</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                                                <div className="h-2 bg-[#00887A] dark:bg-[#00ccb4] rounded-full" style={{ width: '45%' }}></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-xs mb-1 text-gray-700 dark:text-gray-300">
                                                                <span>Presentation</span>
                                                                <span>20%</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                                                                <div className="h-2 bg-[#00887A] dark:bg-[#00ccb4] rounded-full" style={{ width: '20%' }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Learn More Section */}
                <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white to-[#D3E3FC]/20 dark:from-gray-900 dark:to-[#1e3a60]/20">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-5">
                                <div className="lg:col-span-2 bg-gradient-to-br from-[#00887A] to-[#007A6C] dark:from-[#00887A] dark:to-[#005a4e] p-10 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                        <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-[30px] border-white/20"></div>
                                        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full border-[40px] border-white/10"></div>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-6 relative z-10">Academic Workflow Platform</h2>
                                    <p className="text-[#FFCCBC] text-lg mb-6 relative z-10">Transform the way students collaborate on academic projects with our comprehensive workflow management system.</p>
                                    <ul className="space-y-3 text-white/90 relative z-10">
                                        <motion.li
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.1 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[#FFCCBC] flex items-center justify-center text-[#00887A] font-bold text-sm">✓</div>
                                            <span>AI-powered task generation</span>
                                        </motion.li>
                                        <motion.li
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.2 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[#FFCCBC] flex items-center justify-center text-[#00887A] font-bold text-sm">✓</div>
                                            <span>Real-time group collaboration</span>
                                        </motion.li>
                                        <motion.li
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.3 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[#FFCCBC] flex items-center justify-center text-[#00887A] font-bold text-sm">✓</div>
                                            <span>Productivity tools & study timers</span>
                                        </motion.li>
                                        <motion.li
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.4 }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[#FFCCBC] flex items-center justify-center text-[#00887A] font-bold text-sm">✓</div>
                                            <span>Calendar & task synchronization</span>
                                        </motion.li>
                                    </ul>
                                </div>
                                <div className="lg:col-span-3 p-10 bg-white dark:bg-gray-800">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h3>
                                    <div className="space-y-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.1 }}
                                            className="flex gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center text-[#00887A] dark:text-[#00ccb4] font-bold text-lg flex-shrink-0">1</div>
                                            <div>
                                                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Create & Join Groups</h4>
                                                <p className="text-gray-600 dark:text-gray-300">Form academic teams for projects, study groups, or research collaborations. Invite members and set permissions based on roles.</p>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.2 }}
                                            className="flex gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center text-[#00887A] dark:text-[#00ccb4] font-bold text-lg flex-shrink-0">2</div>
                                            <div>
                                                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Generate Tasks with AI</h4>
                                                <p className="text-gray-600 dark:text-gray-300">Describe your project in natural language and let our AI assistant create structured tasks, set deadlines, and intelligently assign tasks to team members.</p>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.3 }}
                                            className="flex gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center text-[#00887A] dark:text-[#00ccb4] font-bold text-lg flex-shrink-0">3</div>
                                            <div>
                                                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Track & Collaborate</h4>
                                                <p className="text-gray-600 dark:text-gray-300">Monitor progress with Kanban boards and Gantt charts. Collaborate in real-time with group chat and file sharing. Use the Pomodoro timer for focused study sessions.</p>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.6, delay: 0.4 }}
                                            className="flex gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] flex items-center justify-center text-[#00887A] dark:text-[#00ccb4] font-bold text-lg flex-shrink-0">4</div>
                                            <div>
                                                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Stay Organized</h4>
                                                <p className="text-gray-600 dark:text-gray-300">Sync with Google Calendar, receive notifications for approaching deadlines, and leverage analytics to identify optimization opportunities in your study workflow.</p>
                                            </div>
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: 0.5 }}
                                        className="mt-10 flex justify-end"
                                    >
                                        <Link href={route('register')} className="inline-flex items-center gap-2 text-[#00887A] dark:text-[#00ccb4] font-semibold hover:text-[#007A6C] dark:hover:text-[#00ddc3] group">
                                            Get Started Today
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <span className="inline-block px-4 py-2 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] text-[#00887A] dark:text-[#00ccb4] font-medium text-sm mb-4">
                                Powerful Features
                            </span>
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Tools for Academic Success</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                                Our platform combines powerful collaboration tools, AI assistance, and productivity features to help students excel in their academic projects.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon="🤖"
                                title="AI Task Generation"
                                description="Describe assignments in natural language and let our AI create structured tasks, set deadlines, and distribute workload intelligently."
                                delay={0}
                            />
                            <FeatureCard
                                icon="👥"
                                title="Group Collaboration"
                                description="Form academic teams, assign roles, and work together in real-time with integrated chat, file sharing, and task assignment."
                                delay={0.1}
                            />
                            <FeatureCard
                                icon="📊"
                                title="Kanban & Gantt Charts"
                                description="Visualize project progress with interactive Kanban boards and Gantt charts for timeline management."
                                delay={0.2}
                            />
                            <FeatureCard
                                icon="🔄"
                                title="Google Calendar Sync"
                                description="Seamlessly integrate with Google Calendar to keep all your academic deadlines and events in one place."
                                delay={0.3}
                            />
                            <FeatureCard
                                icon="⏰"
                                title="Pomodoro Timer"
                                description="Boost productivity with integrated Pomodoro technique timers for focused study sessions and breaks."
                                delay={0.4}
                            />
                            <FeatureCard
                                icon="📱"
                                title="Real-time Notifications"
                                description="Stay updated with real-time notifications for task assignments, deadline reminders, and team messages."
                                delay={0.5}
                            />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mt-16 bg-[#00887A]/10 dark:bg-[#00887A]/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8"
                        >
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ready to Transform Your Academic Workflow?</h3>
                                <p className="text-gray-600 dark:text-gray-300">Join thousands of students already using our platform to excel in their group projects and assignments.</p>
                            </div>
                            <Link
                                href={route('register')}
                                className="px-6 py-3 bg-[#00887A] text-white rounded-lg hover:bg-[#007A6C] transition transform hover:scale-105 font-medium flex-shrink-0"
                            >
                                Get Started Free
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" ref={pricingRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-[#D3E3FC]/30 dark:bg-[#1e3a60]/10">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-center mb-16"
                        >
                            <span className="inline-block px-4 py-2 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] text-[#00887A] dark:text-[#00ccb4] font-medium text-sm mb-4">
                                Simple Pricing
                            </span>
                            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h2>
                            <p className="text-xl text-gray-600 dark:text-gray-300">
                                Select the plan that works best for your academic needs
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PricingPlan
                                title="Free"
                                price="Free"
                                description="Perfect for individual students just getting started."
                                features={[
                                    "Basic task management",
                                    "Calendar integration",
                                    "Study timer",
                                    "5 collaborators max",
                                    "No AI features"
                                ]}
                                ctaText="Get Started"
                                ctaLink={route('register')}
                                delay={0.1}
                            />
                            <PricingPlan
                                title="Student Pro"
                                price="KSh 1,000"
                                description="Advanced tools for serious students."
                                features={[
                                    "150 AI Prompts",
                                    "Unlimited tasks & projects",
                                    "Full AI assistant access",
                                    "Gantt charts & timelines",
                                    "25 collaborators max"
                                ]}
                                ctaText="Get Student Pro"
                                ctaLink={isAuthenticated
                                    ? "/mpesa?amount=1000&plan=student_pro&prompt_count=150"
                                    : "/login?redirect=/mpesa?amount=1000&plan=student_pro&prompt_count=150"}
                                highlighted={true}
                                delay={0.2}
                            />
                            <PricingPlan
                                title="Academic Team"
                                price="KSh 3,000"
                                description="For research groups and academic teams."
                                features={[
                                    "500 AI Prompts",
                                    "Team workspaces",
                                    "Advanced permissions",
                                    "Priority support",
                                    "Unlimited collaborators"
                                ]}
                                ctaText="Get Team Plan"
                                ctaLink={isAuthenticated
                                    ? "/mpesa?amount=3000&plan=academic_team&prompt_count=500"
                                    : "/login?redirect=/mpesa?amount=3000&plan=academic_team&prompt_count=500"}
                                delay={0.3}
                            />
                        </div>
                    </div>
                </section>

                {/* Contact Section */}
                <section id="contact" ref={contactRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <div>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <span className="inline-block px-4 py-2 rounded-full bg-[#D3E3FC] dark:bg-[#1e3a60] text-[#00887A] dark:text-[#00ccb4] font-medium text-sm mb-4">
                                        Get In Touch
                                    </span>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
                                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                                        Have questions about our platform or need assistance? We're here to help.
                                    </p>
                                </motion.div>

                                <div className="space-y-6">
                                    <div className="flex items-start">
                                        <div className="bg-[#D3E3FC] dark:bg-[#1e3a60] rounded-full p-3 mr-4">
                                            <svg className="h-6 w-6 text-[#00887A] dark:text-[#00ccb4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Phone</h3>
                                            <p className="text-gray-600 dark:text-gray-300">+254 112 916 170</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="bg-[#D3E3FC] dark:bg-[#1e3a60] rounded-full p-3 mr-4">
                                            <svg className="h-6 w-6 text-[#00887A] dark:text-[#00ccb4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h3>
                                            <p className="text-gray-600 dark:text-gray-300">info@workflow-academic.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="bg-[#D3E3FC] dark:bg-[#1e3a60] rounded-full p-3 mr-4">
                                            <svg className="h-6 w-6 text-[#00887A] dark:text-[#00ccb4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location</h3>
                                            <p className="text-gray-600 dark:text-gray-300">Karen, Nairobi, Kenya</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-white rounded-xl shadow-lg p-8"
                            >
                                <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
                                <form>
                                    <div className="mb-6">
                                        <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00887A]"
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00887A]"
                                            placeholder="Your email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label htmlFor="message" className="block text-gray-700 mb-2">Message</label>
                                        <textarea
                                            id="message"
                                            rows={5}
                                            className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00887A]"
                                            placeholder="How can we help you?"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                        ></textarea>
                                    </div>
                                    <button
                                        type="button"
                                        className={`bg-[#00887A] text-white py-3 px-6 rounded-md font-medium hover:bg-[#007A6C] transition-transform hover:scale-105 w-full flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                                            }`}
                                        onClick={handleContactSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Message'
                                        )}
                                    </button>

                                    {/* Form status message */}
                                    {formStatus.type && (
                                        <div className={`mt-4 p-3 rounded-md ${formStatus.type === 'success'
                                            ? 'bg-green-50 text-green-800 border border-green-200'
                                            : 'bg-red-50 text-red-800 border border-red-200'
                                            }`}>
                                            {formStatus.message}
                                        </div>
                                    )}
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-[#00887A]">WorkFlow</h3>
                                <p className="text-gray-400 mb-4">Transforming academic collaboration and productivity.</p>
                                <div className="flex space-x-4">
                                    <a href="#" className="text-gray-400 hover:text-white">
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                                        </svg>
                                    </a>
                                    <a href="#" className="text-gray-400 hover:text-white">
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                                        </svg>
                                    </a>
                                    <a href="#" className="text-gray-400 hover:text-white">
                                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Product</h3>
                                <ul className="space-y-2">
                                    <li><a href="/#features" className="text-gray-400 hover:text-white">Features</a></li>
                                    <li><a href="/#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white">API</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white">Integrations</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Resources</h3>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white">Tutorials</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Company</h3>
                                <ul className="space-y-2">
                                    <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                                    <li><a href="/#contact" className="text-gray-400 hover:text-white">Contact</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                            <p>&copy; {new Date().getFullYear()} WorkFlow. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default HomePage;
