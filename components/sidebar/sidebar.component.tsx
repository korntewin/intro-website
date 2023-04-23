import Link from "next/link";

type Company = {
    name: string;
    href: string,
}

type Props = {
    ls: Company[];
}


export default function SideBar({ ls }: Props) {
    return (
        <aside className="z-0 hidden md:block sticky top-[4rem] left-0 h-screen px-4 py-3 overflow-y-auto">
            {ls.map(({ name, href }) => {
                return (
                    <Link href={href} target="_blank" key={`sidebar-${name}-${href}`}>
                        <h1
                            className="text-white text-lg block px-4 py-3 font-semibold leading-none hover:bg-green-300 hover:font-bold rounded-xl"
                        >{name}</h1>
                    </Link>
                )
            })}
        </aside>
    )
}