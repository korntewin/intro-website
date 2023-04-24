import Link from "next/link";

const assetPrefix = "/intro-website";

const NAV_ITEMS = [
    { text: "Home", href: `${assetPrefix}/` },
    { text: "Working Experience", href: `${assetPrefix}/experience` },
    { text: "About Me", href: `${assetPrefix}/about` },
];


function NavItem() {

    return (
        <div className="md:flex md:flex-row gap-2 ml-auto mt-3 mb-3 mr-4">
            {
                NAV_ITEMS.map(item => {
                    return (
                        <Link
                            className="text-white text-lg text-center block px-4 py-3 font-semibold leading-none hover:bg-blue-400 hover:font-bold rounded-xl"
                            href={item.href}
                            key={`nav-${item.text}-${item.href}`}
                        >
                            {item.text}
                        </Link>
                    )
                })
            }
        </div>
    )

}


export default NavItem;
export { assetPrefix };