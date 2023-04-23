import Link from "next/link";
import CardContainer from "./carditem.component";

type Item = {
    imgSrc: string;
    name: string;
    href: string;
    description: string;
    width: number;
    height: number;
}
type Props = {
    ls: Array<Item>;
}

const CardList = ({ ls }: Props) => {

    return (
        <div className="flex items-center flex-row flex-wrap gap-10">
            {ls.map(({ imgSrc, name, href, description, width, height }) => {
                return (
                    <Link href={href} target="_blank" key={`${imgSrc}-${name}`}>
                        <CardContainer imgSrc={imgSrc} name={name} description={description} width={width} height={height} />
                    </Link>
                );
            })}
        </div>
    );
}

export default CardList;