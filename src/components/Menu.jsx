import { useState, useEffect } from 'react';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import logo from '../assets/logo.svg';

const Menu = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrent('/home'); // Set the current route to Home
      navigate('/home'); // Redirect to the Home page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigation = isLoggedIn
    ? [
        { name: 'Insert Data', href: '/insert-data' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Logout', href: '/home', action: handleLogout },
      ]
    : [
        { name: 'Home', href: '/home' },
        { name: 'Login', href: '/login' }
      ];

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
  }

  const [current, setCurrent] = useState(location.pathname);

  const handleClick = (item) => {
    if (item.action) {
      item.action();
    } else {
      setCurrent(item.href);
    }
  };

  return (
    <Disclosure as="nav" className="fixed bg-gray-800 w-full fixed top-0 left-0 right-0 mx-auto">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-center">
              {/* Mobile menu button */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center">
                {/* Logo */}
                <div className="flex shrink-0 items-center">
                  <img alt="Receipt API" src={logo} className="h-8 w-auto" />
                </div>
                {/* Navigation Links */}
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => handleClick(item)}
                        aria-current={current === item.href ? 'page' : undefined}
                        className={classNames(
                          current === item.href
                            ? 'bg-gray-900 text-white shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                          'rounded-md px-3 py-2 text-sm font-medium'
                        )}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  onClick={() => handleClick(item)}
                  aria-current={current === item.href ? 'page' : undefined}
                  className={classNames(
                    current === item.href
                      ? 'bg-gray-900 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'block rounded-md px-3 py-2 text-base font-medium'
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};

export default Menu;
