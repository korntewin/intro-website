import NavigationBar from '../components/navbar.component';
import SideBarComponent from '../components/sidebar.component';
import BodyComponent from '../components/body.component';
import FooterComponent from '../components/footer.component';

const HomePageLayout = ({ children, open, setOpen, navbar_welcomemsg }) => {

    return (
        <div>
            <NavigationBar open={open} setOpen={setOpen} welcomemsg={navbar_welcomemsg}/>
            <SideBarComponent open={open} />
            <BodyComponent open={open}> 
                {children}
                <FooterComponent />
            </BodyComponent>
        </div>
    );
}

export default HomePageLayout;