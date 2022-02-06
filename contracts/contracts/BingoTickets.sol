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
    mapping(address => uint32[]) private _ownerToAllTicketIDs;
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
        require(_tokenIDs.current() < 0xFFFFFFFF, "No tickets left");

        _tokenIDs.increment();
        uint32 _ticketID = uint32(_tokenIDs.current());

        _requestTicket(_ticketID);
        _mint(to, _ticketID);

        _ownerToAllTicketIDs[to].push(_ticketID);

        return _ticketID;
    }

    /****************************** User functions ****************************/
    function getAllTicketIDs(address owner) public view returns (uint32[] memory ids) {
        return _ownerToAllTicketIDs[owner];
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return string(
            abi.encodePacked(
                _baseURI(),"/",symbol(),"/",Strings.toString(tokenId),".json"
            )
        );
    }

    function _baseURI() internal view override virtual returns (string memory) {
        return _ipfsDirectoryURI;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenID
    ) internal override virtual {
        super._transfer(from, to, tokenID);

        _removeFromArray(_ownerToAllTicketIDs[from], uint32(tokenID));
        _ownerToAllTicketIDs[to].push(uint32(tokenID));
    }

    function _removeFromArray(uint32[] storage array, uint32 value) private {
        uint32 arrayLenth = uint32(array.length);
        for (uint32 i = 0; i < arrayLenth; i++) {
            if (array[i] == value) {
                array[i] = array[arrayLenth-1];
                array.pop();
                break;
            }
        }
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

    event TicketFulfillStart(bytes32 requestID, bytes32 ticket);
    event TicketFulfillMiddle(bytes32 requestID, bytes32 ticket, uint32 ticketID);
    event TicketFulfillEnd();
    function fulfillTicketRequest(
        bytes32 requestID,
        bytes32 ticket
    ) public recordChainlinkFulfillment(requestID) {
        emit TicketFulfillStart(requestID, ticket);

        require(_requestToTicketID[requestID] > 0, "Request was already fulfilled");

        // TODO - verify how API failures are handled
        uint32 ticketID = _requestToTicketID[requestID];
        emit TicketFulfillMiddle(requestID, ticket, ticketID);

        ticketIDToTicket[ticketID] = bytes15(ticket);


        delete _requestToTicketID[requestID];
        unfulfilledRequestCount--;

        emit TicketFulfillEnd();
    }
}