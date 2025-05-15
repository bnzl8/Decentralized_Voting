// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Whitelist.sol";

contract Voting is Ownable {
    Whitelist public whitelist;
    
    struct Poll {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        string[] options;
        mapping(uint256 => uint256) votes; // option index => vote count
        mapping(address => bool) hasVoted;
    }

    Poll[] public polls;
    
    event PollCreated(uint256 indexed pollId, string title, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionIndex);
    event PollEnded(uint256 indexed pollId);

    constructor(address _whitelistAddress) Ownable(msg.sender) {
        whitelist = Whitelist(_whitelistAddress);
    }

    modifier onlyWhitelisted() {
        require(whitelist.isWhitelisted(msg.sender), "Address not whitelisted");
        _;
    }

    modifier pollExists(uint256 _pollId) {
        require(_pollId < polls.length, "Poll does not exist");
        _;
    }

    modifier pollActive(uint256 _pollId) {
        require(polls[_pollId].isActive, "Poll is not active");
        require(block.timestamp >= polls[_pollId].startTime, "Poll has not started");
        require(block.timestamp <= polls[_pollId].endTime, "Poll has ended");
        _;
    }

    function createPoll(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _duration,
        string[] memory _options
    ) external onlyOwner {
        require(_options.length >= 2, "Poll must have at least 2 options");
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 pollId = polls.length;
        polls.push();
        Poll storage newPoll = polls[pollId];
        
        newPoll.title = _title;
        newPoll.description = _description;
        newPoll.startTime = _startTime;
        newPoll.endTime = _startTime + _duration;
        newPoll.isActive = true;
        newPoll.options = _options;

        emit PollCreated(pollId, _title, _startTime, newPoll.endTime);
    }

    function vote(uint256 _pollId, uint256 _optionIndex) 
        external 
        onlyWhitelisted 
        pollExists(_pollId) 
        pollActive(_pollId) 
    {
        Poll storage poll = polls[_pollId];
        require(!poll.hasVoted[msg.sender], "Already voted in this poll");
        require(_optionIndex < poll.options.length, "Invalid option index");

        poll.hasVoted[msg.sender] = true;
        poll.votes[_optionIndex]++;

        emit VoteCast(_pollId, msg.sender, _optionIndex);
    }

    function endPoll(uint256 _pollId) external onlyOwner pollExists(_pollId) {
        Poll storage poll = polls[_pollId];
        require(poll.isActive, "Poll is already ended");
        poll.isActive = false;
        emit PollEnded(_pollId);
    }

    function getPollResults(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (uint256[] memory) 
    {
        Poll storage poll = polls[_pollId];
        uint256[] memory results = new uint256[](poll.options.length);
        
        for (uint256 i = 0; i < poll.options.length; i++) {
            results[i] = poll.votes[i];
        }
        
        return results;
    }

    function getPollInfo(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            bool isActive,
            string[] memory options
        ) 
    {
        Poll storage poll = polls[_pollId];
        return (
            poll.title,
            poll.description,
            poll.startTime,
            poll.endTime,
            poll.isActive,
            poll.options
        );
    }

    function hasVoted(uint256 _pollId, address _voter) 
        external 
        view 
        pollExists(_pollId) 
        returns (bool) 
    {
        return polls[_pollId].hasVoted[_voter];
    }

    function getPollsCount() external view returns (uint256) {
        return polls.length;
    }
} 