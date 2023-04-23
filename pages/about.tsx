import CardList from "@/components/cardlist/cardlist.component";
import NavBar from "@/components/navbar/v2/navbar.component";

const companies = [
    { imgSrc: "/linkedin.png", name: "Linkedin", href: "https://www.linkedin.com/in/korntewin/", description: "You can follow my linkedin here", width: 100, height: 100 },
    { imgSrc: "/github.png", name: "Github", href: "https://github.com/korntewin", description: "And you can follow my Github here", width: 100, height: 100 },
]

function About() {

    return (
        <div className="bg-gradient-to-r from-green-400 to-blue-500 brightness-90" >
            <NavBar addClass="z-40 sticky top-0" />
            <div className="flex flex-col items-center h-screen">
                <p className="mx-20 mt-10 text-justify text-2xl text-white font-semibold drop-shadow">
                    I&apos;m a self-starter with a willingness to learn, exhibited by proven self-taught skills in Engineergin with GCP&apos;s Professional Data Enginner and GCP&apos;s Professional Data Architect certificate, Deep Learning with Tensorflow Developer Certificate and contribution to Tensorflow Organization codebase.
                </p>
                <p className="mx-20 mt-5 text-justify text-2xl text-white font-semibold drop-shadow">
                    I am currently working at Thinking Machines as a Machine Learning Engineer, with experience in developing, building, deploying, and monitoring ML model (scikit-learn/tensorflow) and data processing pipeline (Spark on hadoop ecosystem) in production. I have experience working with data processing systems for big data of multiple TB scale with Spark on both batch/online channel.
                </p>
                <p className="mx-20 mt-5 text-justify text-2xl text-white font-semibold drop-shadow">
                    My background is in Master of Engineering major in Power System which heavily applies various optimization techniques (Linear programming/Quadratic programming/Stochastic optimization) for research field in disruptive technology, especially Battery Energy Storage System (BESS).
                    I am also familiar with financial feasibility studies to evaluate financial profit for Photovoltaic System and BESS project.
                </p>
                <CardList ls={companies} />
            </div>
        </div>
    )

}


export default About;