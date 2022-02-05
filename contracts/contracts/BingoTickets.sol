// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import { OracleStructs } from "./OracleStructs.sol";

import "hardhat/console.sol";

contract BingoTickets is ERC721, ChainlinkClient {
    using Counters for Counters.Counter;
    using Chainlink for Chainlink.Request;

    /********************************* Tickets ********************************/
    uint32 public unfulfilledRequestCount;
    mapping(uint32 => bytes15) public ticketIDToTicket;
    mapping(bytes32 => uint32) private _requestToTicketID;
    Counters.Counter private _tokenIDs;

    /*************************** Contract settings *****************************/
    address private immutable _owner;
    LinkTokenInterface private immutable LINK;
    string private _ipfsDirectoryURI;
    OracleStructs.API private _apiOracle;

    /**************************** Control functions ****************************/
    constructor(
        address owner,
        string memory gameName,
        string memory gameSymbol,
        string memory ipfsDirectoryURI,
        address linkTokenAddress,
        OracleStructs.API memory apiOracleSettings
    ) ERC721(gameName, gameSymbol) {
        _owner = owner;

        _ipfsDirectoryURI = ipfsDirectoryURI;

        _apiOracle = apiOracleSettings;
        setChainlinkToken(linkTokenAddress);
        LINK = LinkTokenInterface(linkTokenAddress);
    }

    function withdrawLink() external {
        uint256 linkLeft = LINK.balanceOf(address(this));
        bool success = LINK.transfer(_owner, linkLeft);
        require(success, "LINK transfter failed");
    }

    function mintTicket(address to) external returns (uint32 ticketID) {
        require(msg.sender == _owner, "Minting can only be done through BingoTickets");

        _tokenIDs.increment();
        uint32 _ticketID = uint32(_tokenIDs.current());

        _requestTicket(_ticketID);
        _mint(to, _ticketID);

        return _ticketID;
    }

    /****************************** User functions ****************************/
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return string(
            abi.encodePacked(
                _baseURI(),"/",symbol(),"/",Strings.toString(tokenId),".json" // TODO - verifty if the right path
            )
        );
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return _ipfsDirectoryURI;
    }

    /**************************** Oracle functions ****************************/
    function _requestTicket(uint32 ticketID) private {
        require(LINK.balanceOf(address(this)) >= _apiOracle.fee, "Not enough LINK");

        Chainlink.Request memory request = buildChainlinkRequest(
            _apiOracle.jobID,
            address(this),
            this.fulfillTicketRequest.selector
        );

        string memory getURL = string(
            abi.encodePacked(
                "https://api.polybingo.gwgplay.com/api/v1/ticket",
                "?game_id=",symbol(),
                "&ticket_id=",Strings.toString(ticketID)
            )
        );

        request.add("get", getURL);
        request.add("path", "ticket");

        bytes32 requestID = sendChainlinkRequestTo(
            _apiOracle.oracle,
            request,
            _apiOracle.fee
        );

        _requestToTicketID[requestID] = ticketID;
        unfulfilledRequestCount++;
    }

    bytes32[] public fulfillments;

    function fulfillTicketRequest(
        bytes32 requestID,
        bytes32 ticket
    ) public recordChainlinkFulfillment(requestID) {
        require(_requestToTicketID[requestID] > 0, "Request was already fulfilled");

        fulfillments.push(ticket);

        // TODO - verify how API failures are handled
        uint32 ticketID = _requestToTicketID[requestID];
        uint8 bitsToShiftForArrayTrim = 8 * (32 - 15);
        ticketIDToTicket[ticketID] = bytes15(ticket << bitsToShiftForArrayTrim);

        delete _requestToTicketID[requestID];
        unfulfilledRequestCount--;
    }
}