import styled from "styled-components";

const Footer = styled.footer`
  width: 100%;
  color: gray;
  text-align: left;
  margin-right: 1em;
`;

type CopyrightTextProps = {
  marginTop?: string;
};

const CopyrightText = styled.p<CopyrightTextProps>`
  font-family: "Arial", sans-serif;
  font-size: 14px;
  padding-left: 1em;
  ${(props) => props.marginTop && `margin-top: ${props.marginTop};`}
`;

const StyledLink = styled.a`
  color: gray;
  padding-right: 0.5em;
`;

const CustomSpan = styled.span`
  padding-right: 0.5em;
`;

const year = new Date().getFullYear();
const name = "Korntewin";

export default function FooterComponent() {
  return (
    <Footer>
      <CopyrightText marginTop={"4em"}>
        &copy; {year} {name}. All rights reserved
      </CopyrightText>
      <CopyrightText>
        <CustomSpan>Please follow me here 👉</CustomSpan>
        <StyledLink
          href="https://github.com/korntewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </StyledLink>
        <StyledLink
          href="https://linkedin.com/in/korntewin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Linkedin
        </StyledLink>
      </CopyrightText>
    </Footer>
  );
}
