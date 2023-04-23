import Link from "next/link";
import Image from 'next/image';
import React, { useState } from "react";
import NavItem from "./navitem.component";

const MENU_LIST = [
  { text: "Working Experience", href: "/working-exp" },
  { text: "About Me", href: "/about" },
];
const Navbar = () => {
  const [navActive, setNavActive] = useState(true);
  const [activeIdx, setActiveIdx] = useState(-1);

  return (
    <header>
      <nav className={`nav`}>
        <Link href={"/about"}>
             {/* <Image
               src="/logo.jpg"
               alt="My Logo"
              //  className="dark:invert"
               width={50}
               height={50}
               priority
             /> */}
            <h1 className="logo">My Logo</h1>
        </Link>
        <div
          onClick={() => setNavActive(!navActive)}
          className={`nav__menu-bar`}
        >
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className={`${navActive ? "active" : ""} nav__menu-list`}>
          {MENU_LIST.map((menu, idx) => (
            <div
              onClick={() => {
                setActiveIdx(idx);
                setNavActive(false);
              }}
              key={menu.text}
            >
              <NavItem active={activeIdx === idx} text={menu.text} href={menu.href} />
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;