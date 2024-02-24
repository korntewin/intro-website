import NavigationBar from '../components/navbar.component';
import SideBarComponent from '../components/sidebar.component';
import BodyComponent from '../components/body.component';

const HomePageLayout = ({ children, open, setOpen }) => {

    return (
        <div>
            <NavigationBar open={open} setOpen={setOpen} />
            <SideBarComponent open={open} />
            <BodyComponent open={open}> 
                {children}
            </BodyComponent>
        </div>
    );
}

export default HomePageLayout;