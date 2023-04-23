import Link from "next/link";
import Image from "next/image";

type Props = {
    imgSrc: string;
    name: string;
    description: string;
    width: number;
    height: number;
}

function CardContainer({ imgSrc, name, description, width, height }: Props) {

    return (
        <div
            className="m-10 p-16 
                flex items-center flex-col w-72 h-max
                bg-gradient-to-r from-blue-500 to-green-400 hover:from-yellow-500 hover:to-pink-500 
                cursor-pointer rounded-xl
                hover:transition-transform transition ease-out delay-150 transform hover:scale-110
                drop-shadow
                "
            key={`${imgSrc}-${name}`}
        >
            <Image
                src={imgSrc}
                alt={name}
                width={width}
                height={height}
            />
            <h1 className="text-center mx-2 mt-5 text-xl text-white drop-shadow-xl font-semibold">
                {name}
            </h1>
            <h1 className="text-center text-white">
                {description}
            </h1>
        </div>
    );
}

export default CardContainer;