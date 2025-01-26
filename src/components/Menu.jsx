import { useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import logo from '../assets/logo.svg';
import { Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Home', href: '/home' },
  { name: 'Login', href: '/login' },
  { name: 'Sign Up', href: '/sign-up' },
  { name: 'Data', href: '/data' }
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Example() {
  const location = useLocation();
  const [current, setCurrent] = useState(location.pathname);

  return (
    <Disclosure as="nav" className="bg-gray-800 w-full fixed top-0 left-0 right-0 mx-auto">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-center">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <Disclosure.Button className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
              <span className="absolute -inset-0.5" />
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
            </Disclosure.Button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            {/* Logo */}
            <div className="flex shrink-0 items-center">
              <img
                alt="Receipt API"
                src={logo}
                className="h-20 w-auto"
              />
            </div>
            {/* Navigation Links */}
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setCurrent(item.href)}
                    aria-current={current === item.href ? 'page' : undefined}
                    className={classNames(
                      current === item.href
                        ? 'bg-gray-900 text-white shadow-lg'
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
              onClick={() => setCurrent(item.href)}
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
    </Disclosure>
  );
}